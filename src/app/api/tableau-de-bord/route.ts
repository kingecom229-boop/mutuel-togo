import { ok, route } from "@/server/http";
import { requireUser, publicUser } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { getProfileViewForUser } from "@/server/services/profile";
import { getAnnualRate, getWalletInfo } from "@/server/services/wallet";
import { LOAN_SELECT, TRANSACTION_SELECT } from "@/server/selects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tableau-de-bord — données d'accueil du client (solde, historique réel, stats). */
export const GET = route(async () => {
  const user = await requireUser();

  const [profileView, wallet, annualRate, transactions, loans, resume, unreadRow] =
    await Promise.all([
      getProfileViewForUser(user),
      getWalletInfo(user.id),
      getAnnualRate(),
      query(
        `SELECT ${TRANSACTION_SELECT} FROM transactions
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
        [user.id]
      ),
      query<Record<string, unknown> & { status: string; monthlyPaymentFcfa: number }>(
        `SELECT ${LOAN_SELECT} FROM loan_requests
         WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [user.id]
      ),
      queryOne<{
        totalCreditsApprouvesFcfa: number;
        creditsEnAttente: number;
        creditsApprouves: number;
        transfertsEnAttente: number;
      }>(
        `SELECT
           COALESCE(SUM(CASE WHEN status='APPROUVE' THEN amount_fcfa END),0)::int AS "totalCreditsApprouvesFcfa",
           COUNT(*) FILTER (WHERE status='EN_ATTENTE')::int AS "creditsEnAttente",
           COUNT(*) FILTER (WHERE status='APPROUVE')::int AS "creditsApprouves",
           0 AS "transfertsEnAttente"
         FROM loan_requests WHERE user_id = $1`,
        [user.id]
      ),
      queryOne<{ nonLus: number }>(
        `SELECT COUNT(*)::int AS "nonLus" FROM messages
         WHERE conversation_user_id = $1 AND sender_role = 'ADMIN' AND NOT read_by_user`,
        [user.id]
      ),
    ]);

  const pendingTransfers = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM transfer_requests WHERE user_id = $1 AND status = 'EN_ATTENTE'`,
    [user.id]
  );

  const mensueliteEnCoursFcfa = loans
    .filter((l) => l.status === "APPROUVE")
    .reduce((somme, l) => somme + Number(l.monthlyPaymentFcfa ?? 0), 0);

  return ok({
    user: publicUser(user),
    date: new Date().toISOString(),
    annualRatePercent: annualRate,
    profile: {
      percent: profileView.percent,
      status: profileView.status,
      missingLabels: profileView.missingLabels,
    },
    WalletInfo: wallet,
    stats: {
      totalCreditsApprouvesFcfa: resume?.totalCreditsApprouvesFcfa ?? 0,
      creditsEnAttente: resume?.creditsEnAttente ?? 0,
      creditsApprouves: resume?.creditsApprouves ?? 0,
      transfertsEnAttente: pendingTransfers?.n ?? 0,
      mensueliteEnCoursFcfa: mensueliteEnCoursFcfa,
      messagesNonLus: unreadRow?.nonLus ?? 0,
    },
    transactions,
    recentLoans: loans.slice(0, 5),
  });
});
