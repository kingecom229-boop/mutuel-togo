/**
 * Initialisation de la base : migrations + parametres + compte admin.
 * Usage : npm run db:setup
 * (La meme initialisation est aussi declenchee automatiquement au premier
 * appel API, donc ce script sert surtout a verifier votre configuration.)
 */
import { closeDb, ensureDbReady, queryOne } from "../src/server/db";

async function main() {
  await ensureDbReady();
  const row = await queryOne<{ count: number }>(`SELECT COUNT(*)::int AS count FROM users`);
  console.log(`[db:setup] Base prete. Utilisateurs actuels : ${row?.count ?? 0}`);
  await closeDb();
}

main().catch((error) => {
  console.error("[db:setup] Echec :", error);
  process.exit(1);
});
