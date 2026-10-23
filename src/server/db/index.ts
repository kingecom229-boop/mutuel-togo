/**
 * ============================================================
 * Couche base de donnees MUTUEL TOGO
 * ------------------------------------------------------------
 * Deux modes, un seul code SQL PostgreSQL :
 *  - LOCAL (sans DATABASE_URL) : PostgreSQL embarque PGlite,
 *    donnees persistees dans ./.data/pglite — zero installation,
 *    ideal pour developper/tester dans VS Code.
 *  - PRODUCTION (DATABASE_URL=postgresql://...) : vrai serveur
 *    PostgreSQL via le pilote "pg".
 *
 * Toutes les requetes metier passent par query()/withTransaction()
 * avec des parametres lies ($1, $2...) — aucune concatenation SQL.
 * ============================================================
 */
import path from "node:path";
import fs from "node:fs";
import bcrypt from "bcryptjs";
import { MIGRATIONS } from "./migrations";

export type SqlExecutor = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => Promise<T[]>;

interface DbState {
  ready: Promise<void> | null;
  mode: "pglite" | "postgres" | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pglite: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pool: any | null;
}

const globalForDb = globalThis as unknown as { __mutuelDb?: DbState };
const state: DbState =
  globalForDb.__mutuelDb ?? { ready: null, mode: null, pglite: null, pool: null };
globalForDb.__mutuelDb = state;

function databaseUrl(): string {
  return (process.env.DATABASE_URL ?? "").trim();
}

async function execRaw(sqlText: string): Promise<void> {
  if (state.mode === "pglite") {
    await state.pglite.exec(sqlText);
  } else {
    await state.pool.query(sqlText);
  }
}

/** Executeur de requete hors transaction. */
const baseQuery: SqlExecutor = async (text, params = []) => {
  if (state.mode === "pglite") {
    const result = await state.pglite.query(text, params);
    return result.rows;
  }
  const result = await state.pool.query(text, params);
  return result.rows;
};

async function migrate(q: SqlExecutor): Promise<void> {
  await execRaw(
    `CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  );
  for (const migration of MIGRATIONS) {
    const applied = await q<{ id: string }>(`SELECT id FROM _migrations WHERE id = $1`, [
      migration.id,
    ]);
    if (applied.length === 0) {
      await execRaw(migration.sql);
      await q(`INSERT INTO _migrations (id) VALUES ($1)`, [migration.id]);
      console.log(`[db] Migration appliquee : ${migration.id}`);
    }
  }
  await q(
    `INSERT INTO settings (id, annual_rate_percent) VALUES (1, 2) ON CONFLICT (id) DO NOTHING`
  );
}

/**
 * Cree le compte admin au premier demarrage si ADMIN_EMAIL / ADMIN_PASSWORD
 * sont definis dans l'environnement. Ne reecrit jamais un mot de passe existant.
 */
async function seedAdmin(q: SqlExecutor): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "").trim() || "Administration MUTUEL TOGO";
  const placeholder = "saisissez-ici-le-mot-de-passe-admin-initial";

  if (!email || !password || password === placeholder) {
    console.warn(
      "[db] Admin non cree : renseignez ADMIN_EMAIL et ADMIN_PASSWORD dans .env.local."
    );
    return;
  }
  if (password.length < 8) {
    console.warn("[db] Admin non cree : ADMIN_PASSWORD doit contenir au moins 8 caracteres.");
    return;
  }
  const existing = await q<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.length > 0) return;

  const { randomUUID } = await import("node:crypto");
  const passwordHash = await bcrypt.hash(password, 12);
  await q(
    `INSERT INTO users (id, full_name, email, password_hash, role, balance_fcfa)
     VALUES ($1, $2, $3, $4, 'ADMIN', 0)`,
    [randomUUID(), name, email, passwordHash]
  );
  console.log(`[db] Compte administrateur cree (${email}).`);
}

async function init(): Promise<void> {
  const url = databaseUrl();
  if (/^postgres(ql)?:\/\//i.test(url)) {
    state.mode = "postgres";
    const { Pool } = await import("pg");
    state.pool = new Pool({ connectionString: url, max: 10 });
    console.log("[db] Mode PostgreSQL distant.");
  } else {
    state.mode = "pglite";
    const { PGlite } = await import("@electric-sql/pglite");
    const dataDir =
      (process.env.PGLITE_DATA_DIR ?? "").trim() ||
      path.join(process.cwd(), ".data", "pglite");
    fs.mkdirSync(path.dirname(dataDir), { recursive: true });
    state.pglite = new PGlite(dataDir);
    await state.pglite.waitReady;
    console.log(`[db] Mode PostgreSQL embarque (PGlite) : ${dataDir}`);
  }
  await migrate(baseQuery);
  await seedAdmin(baseQuery);
}

/** A appeler (directement ou via query) avant tout acces aux donnees. */
export async function ensureDbReady(): Promise<void> {
  if (!state.ready) state.ready = init();
  await state.ready;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureDbReady();
  return baseQuery<T>(text, params);
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Transaction atomique — indispensable pour tout mouvement d'argent.
 * Exemple : approuver un credit = 1) solde + 2) historique + 3) statut.
 */
export async function withTransaction<T>(fn: (q: SqlExecutor) => Promise<T>): Promise<T> {
  await ensureDbReady();
  if (state.mode === "pglite") {
    return state.pglite.transaction(async (tx: {
      query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
    }) => {
      const q: SqlExecutor = async (text, params = []) => (await tx.query(text, params)).rows as never;
      return fn(q);
    });
  }
  const client = await state.pool.connect();
  try {
    await client.query("BEGIN");
    const q: SqlExecutor = async (text, params = []) =>
      (await client.query(text, params)).rows as never;
    const result = await fn(q);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  if (state.pglite) await state.pglite.close();
  if (state.pool) await state.pool.end();
  state.ready = null;
  state.pglite = null;
  state.pool = null;
}
