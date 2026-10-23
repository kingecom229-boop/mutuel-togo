/**
 * Regles du portefeuille MUTUEL TOGO.
 * - Bonus de bienvenue de 500 FCFA : retirable seulement apres le 1er credit accorde.
 * - Les transferts EN_ATTENTE reservent leur montant pour eviter les depassements.
 */
import { queryOne, type SqlExecutor } from "../db";
import { BONUS_BIENVENUE_FCFA } from "@/lib/constants";

export interface WalletInfo {
  balanceFcfa: number;
  pendingTransfersFcfa: number;
  hasApprovedLoan: boolean;
  bonusLockedFcfa: number;
  availableFcfa: number;
}

export async function getWalletInfo(
  userId: string,
  executor?: SqlExecutor
): Promise<WalletInfo> {
  const getOne = executor
    ? async <T,>(text: string, params: unknown[]): Promise<T | null> =>
        ((await executor<T>(text, params))[0] ?? null) as T | null
    : queryOne;

  const row = await getOne<{
    balanceFcfa: number;
    pendingTransfersFcfa: number;
    approvedLoans: number;
  }>(
    `SELECT
       u.balance_fcfa AS "balanceFcfa",
       COALESCE((SELECT SUM(amount_fcfa) FROM transfer_requests
                  WHERE user_id = u.id AND status = 'EN_ATTENTE'), 0)::int AS "pendingTransfersFcfa",
       (SELECT COUNT(*) FROM loan_requests
         WHERE user_id = u.id AND status = 'APPROUVE')::int AS "approvedLoans"
     FROM users u WHERE u.id = $1`,
    [userId]
  );

  const balanceFcfa = row?.balanceFcfa ?? 0;
  const pendingTransfersFcfa = row?.pendingTransfersFcfa ?? 0;
  const hasApprovedLoan = (row?.approvedLoans ?? 0) > 0;
  const bonusLockedFcfa = hasApprovedLoan ? 0 : Math.min(BONUS_BIENVENUE_FCFA, balanceFcfa);
  const availableFcfa = Math.max(
    0,
    balanceFcfa - pendingTransfersFcfa - bonusLockedFcfa
  );

  return { balanceFcfa, pendingTransfersFcfa, hasApprovedLoan, bonusLockedFcfa, availableFcfa };
}

export async function getAnnualRate(executor?: SqlExecutor): Promise<number> {
  if (executor) {
    const rows = await executor<{ annualRatePercent: number }>(
      `SELECT annual_rate_percent AS "annualRatePercent" FROM settings WHERE id = 1`
    );
    return Number(rows[0]?.annualRatePercent ?? 2);
  }
  const row = await queryOne<{ annualRatePercent: number }>(
    `SELECT annual_rate_percent AS "annualRatePercent" FROM settings WHERE id = 1`
  );
  return Number(row?.annualRatePercent ?? 2);
}
