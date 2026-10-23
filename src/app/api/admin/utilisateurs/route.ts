import { ok, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/utilisateurs — liste des clients avec état du dossier KYC. */
export const GET = route(async () => {
  await requireAdmin();
  const utilisateurs = await query(
    `SELECT
       u.id, u.full_name AS "fullName", u.phone, u.email,
       u.balance_fcfa AS "balanceFcfa", u.is_active AS "isActive",
       u.created_at AS "createdAt",
       COALESCE(p.completion_percent, 0) AS "profilePercent",
       COALESCE(p.status, 'INCOMPLET') AS "profileStatus",
       p.city, p.profession,
       (SELECT COUNT(*) FROM loan_requests l WHERE l.user_id = u.id)::int AS "nbCredits",
       (SELECT COUNT(*) FROM loan_requests l WHERE l.user_id = u.id AND l.status='EN_ATTENTE')::int AS "creditsEnAttente",
       (SELECT COUNT(*) FROM transfer_requests t WHERE t.user_id = u.id AND t.status='EN_ATTENTE')::int AS "transfertsEnAttente",
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_user_id = u.id AND m.sender_role='USER' AND NOT m.read_by_admin)::int AS "messagesNonLus"
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.role = 'USER'
     ORDER BY u.created_at DESC`
  );
  return ok({ utilisateurs });
});
