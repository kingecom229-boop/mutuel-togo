import { ok, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/transferts?statut=EN_ATTENTE — demandes de transfert à traiter. */
export const GET = route(async (request: Request) => {
  await requireAdmin();
  const statut = new URL(request.url).searchParams.get("statut");
  const statutsValides = ["EN_ATTENTE", "APPROUVE", "REFUSE"];
  const filtre = statut && statutsValides.includes(statut) ? statut : null;

  const transferts = await query(
    `SELECT
       t.id, t.user_id AS "userId", t.channel, t.provider,
       t.destination_name AS "destinationName", t.destination_number AS "destinationNumber",
       t.amount_fcfa AS "amountFcfa", t.status, t.admin_note AS "adminNote",
       t.decided_at AS "decidedAt", t.created_at AS "createdAt", t.updated_at AS "updatedAt",
       u.full_name AS "clientName", u.phone AS "clientPhone", u.balance_fcfa AS "clientBalanceFcfa"
     FROM transfer_requests t
     JOIN users u ON u.id = t.user_id
     WHERE ($1::text IS NULL OR t.status = $1)
     ORDER BY (t.status = 'EN_ATTENTE') DESC, t.created_at DESC`,
    [filtre]
  );
  return ok({ transferts });
});
