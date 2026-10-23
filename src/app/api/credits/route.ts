import { randomUUID } from "node:crypto";
import { ApiError, ok, readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { query } from "@/server/db";
import { loanSchema } from "@/server/validation";
import { getProfileViewForUser } from "@/server/services/profile";
import { getAnnualRate } from "@/server/services/wallet";
import { computeLoan } from "@/lib/loan";
import { LOAN_SELECT } from "@/server/selects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const loans = await query(
    `SELECT ${LOAN_SELECT} FROM loan_requests WHERE user_id = $1 ORDER BY created_at DESC`,
    [user.id]
  );
  return ok({ loans });
});

/**
 * POST /api/credits — nouvelle demande de crédit.
 * Condition : profil APPROUVÉ (100 %). Plusieurs demandes simultanées autorisées.
 * L'admin décide ensuite : approuvé = montant crédité sur le solde.
 */
export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = loanSchema.parse(await readJson(request));

  const profile = await getProfileViewForUser(user);
  if (profile.status !== "APPROUVE") {
    throw new ApiError(
      403,
      `Votre profil est complété à ${profile.percent} %. Atteignez 100 % (mention APPROUVÉ) avant de demander un crédit.`,
      { missingLabels: profile.missingLabels, percent: profile.percent }
    );
  }

  const annualRate = await getAnnualRate();
  const calcul = computeLoan(body.amountFcfa, body.durationYears, annualRate);
  const id = randomUUID();

  await query(
    `INSERT INTO loan_requests
       (id, user_id, amount_fcfa, duration_years, annual_rate_percent,
        monthly_payment_fcfa, total_interest_fcfa, total_repay_fcfa, reason, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'EN_ATTENTE')`,
    [
      id,
      user.id,
      calcul.amountFcfa,
      calcul.durationYears,
      calcul.annualRatePercent,
      calcul.monthlyPaymentFcfa,
      calcul.totalInterestFcfa,
      calcul.totalRepayFcfa,
      body.reason,
    ]
  );

  const loans = await query(
    `SELECT ${LOAN_SELECT} FROM loan_requests WHERE id = $1`,
    [id]
  );
  return ok(
    {
      loan: loans[0],
      message:
        "Demande de crédit envoyée. La direction étudie votre dossier et vous répondra via la messagerie.",
    },
    201
  );
});
