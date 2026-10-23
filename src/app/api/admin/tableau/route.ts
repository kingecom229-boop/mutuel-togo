import { ok, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { getAnnualRate } from "@/server/services/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/tableau — indicateurs du back-office. */
export const GET = route(async () => {
  await requireAdmin();

  const [clients, credits, transferts, messages, recentClients, annualRate] =
    await Promise.all([
      queryOne<{ total: number; approuves: number; encoursFcfa: number }>(
        `SELECT
           COUNT(*) FILTER (WHERE u.role='USER')::int AS total,
           COUNT(*) FILTER (WHERE u.role='USER' AND p.status='APPROUVE')::int AS approuves,
           COALESCE(SUM(CASE WHEN u.role='USER' THEN u.balance_fcfa END),0)::int AS "encoursFcfa"
         FROM users u LEFT JOIN profiles p ON p.user_id = u.id`
      ),
      queryOne<{
        enAttente: number; approuves: number; refuses: number; totalAccordeFcfa: number;
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE status='EN_ATTENTE')::int AS "enAttente",
           COUNT(*) FILTER (WHERE status='APPROUVE')::int AS approuves,
           COUNT(*) FILTER (WHERE status='REFUSE')::int AS refuses,
           COALESCE(SUM(CASE WHEN status='APPROUVE' THEN amount_fcfa END),0)::int AS "totalAccordeFcfa"
         FROM loan_requests`
      ),
      queryOne<{ enAttente: number; approuves: number; refuses: number }>(
        `SELECT
           COUNT(*) FILTER (WHERE status='EN_ATTENTE')::int AS "enAttente",
           COUNT(*) FILTER (WHERE status='APPROUVE')::int AS approuves,
           COUNT(*) FILTER (WHERE status='REFUSE')::int AS refuses
         FROM transfer_requests`
      ),
      queryOne<{ nonLus: number }>(
        `SELECT COUNT(*)::int AS "nonLus" FROM messages
         WHERE sender_role = 'USER' AND NOT read_by_admin`
      ),
      query(
        `SELECT u.id, u.full_name AS "fullName", u.phone, u.balance_fcfa AS "balanceFcfa",
                u.created_at AS "createdAt",
                COALESCE(p.completion_percent, 0) AS "profilePercent",
                COALESCE(p.status, 'INCOMPLET') AS "profileStatus"
         FROM users u LEFT JOIN profiles p ON p.user_id = u.id
         WHERE u.role = 'USER' ORDER BY u.created_at DESC LIMIT 6`
      ),
      getAnnualRate(),
    ]);

  return ok({
    clients: { total: clients?.total ?? 0, approuves: clients?.approuves ?? 0 },
    encoursSoldesFcfa: clients?.encoursFcfa ?? 0,
    credits,
    transferts,
    messagesNonLus: messages?.nonLus ?? 0,
    annualRatePercent: annualRate,
    recentClients,
  });
});
