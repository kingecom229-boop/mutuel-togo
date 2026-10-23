import { ok, route } from "@/server/http";
import { queryOne } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/sante — contrôle de l'état du service (supervision, tests). */
export const GET = route(async () => {
  const row = await queryOne<{ ok: number }>(`SELECT 1 AS ok`);
  return ok({ statut: "en_ligne", baseDeDonnees: row?.ok === 1 ? "ok" : "inconnue" });
});
