import { ok, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/credits?statut=EN_ATTENTE — toutes les demandes de crédit. */
export const GET = route(async (request: Request) => {
  await requireAdmin();
  const statut = new URL(request.url).searchParams.get("statut");
  const statutsValides = ["EN_ATTENTE", "APPROUVE", "REFUSE"];
  const filtre = statut && statutsValides.includes(statut) ? statut : null;

  const credits = await query(
    `SELECT
       l.id, l.user_id AS "userId", l.amount_fcfa AS "amountFcfa",
       l.duration_years AS "durationYears", l.annual_rate_percent AS "annualRatePercent",
       l.monthly_payment_fcfa AS "monthlyPaymentFcfa",
       l.total_interest_fcfa AS "totalInterestFcfa", l.total_repay_fcfa AS "totalRepayFcfa",
       l.reason, l.status, l.admin_note AS "adminNote", l.decided_at AS "decidedAt",
       l.created_at AS "createdAt", l.updated_at AS "updatedAt",
       u.full_name AS "clientName", u.phone AS "clientPhone",
       COALESCE(p.completion_percent,0) AS "profilePercent",
       COALESCE(p.status,'INCOMPLET') AS "profileStatus"
     FROM loan_requests l
     JOIN users u ON u.id = l.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE ($1::text IS NULL OR l.status = $1)
     ORDER BY (l.status = 'EN_ATTENTE') DESC, l.created_at DESC`,
    [filtre]
  );
  return ok({ credits });
});
