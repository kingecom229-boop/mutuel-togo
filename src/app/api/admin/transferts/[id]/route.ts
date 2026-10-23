import { randomUUID } from "node:crypto";
import { ApiError, ok, readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { decisionSchema } from "@/server/validation";
import { newReference } from "@/server/references";
import { TRANSFER_SELECT } from "@/server/selects";
import { BONUS_BIENVENUE_FCFA, TRANSACTION_TYPES } from "@/lib/constants";
import { formatFcfa } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/transferts/[id]
 * APPROUVE : débit du solde + historique (atomique). Le versement réel vers
 * Mobile Money / la banque est ensuite finalisé par la direction hors plateforme.
 * REFUSE : aucun mouvement.
 */
export const PATCH = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = decisionSchema.parse(await readJson(request));

    const transfer = await withTransaction(async (q) => {
      const transfers = await q<{
        id: string; userId: string; amountFcfa: number; status: string;
        channel: string; provider: string | null; destinationNumber: string;
      }>(
        `SELECT id, user_id AS "userId", amount_fcfa AS "amountFcfa", status, channel,
                provider, destination_number AS "destinationNumber"
         FROM transfer_requests WHERE id = $1 FOR UPDATE`,
        [id]
      );
      const current = transfers[0];
      if (!current) throw new ApiError(404, "Demande de transfert introuvable.");
      if (current.status !== "EN_ATTENTE") {
        throw new ApiError(409, "Ce transfert a déjà été traité.");
      }

      if (body.decision === "APPROUVE") {
        const users = await q<{ balanceFcfa: number }>(
          `SELECT balance_fcfa AS "balanceFcfa" FROM users WHERE id = $1 FOR UPDATE`,
          [current.userId]
        );
        const solde = users[0]?.balanceFcfa ?? 0;
        const creditsApprouves = await q<{ n: number }>(
          `SELECT COUNT(*)::int AS n FROM loan_requests WHERE user_id = $1 AND status = 'APPROUVE'`,
          [current.userId]
        );
        const reserveBonus =
          (creditsApprouves[0]?.n ?? 0) === 0
            ? Math.min(BONUS_BIENVENUE_FCFA, solde)
            : 0;
        if (solde - current.amountFcfa < reserveBonus) {
          throw new ApiError(
            409,
            `Solde insuffisant pour valider ce transfert : le client dispose de ${formatFcfa(solde)} (bonus verrouillé inclus : ${formatFcfa(reserveBonus)}).`
          );
        }
        const nouveauSolde = solde - current.amountFcfa;
        await q(`UPDATE users SET balance_fcfa = $1, updated_at = NOW() WHERE id = $2`, [
          nouveauSolde,
          current.userId,
        ]);
        await q(
          `INSERT INTO transactions
             (id, user_id, reference, type, label, amount_fcfa, balance_after_fcfa, transfer_request_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            randomUUID(),
            current.userId,
            newReference("TRANSFERT"),
            TRANSACTION_TYPES.TRANSFERT,
            `Transfert ${current.provider ?? current.channel} vers ${current.destinationNumber}`,
            -current.amountFcfa,
            nouveauSolde,
            current.id,
          ]
        );
      }

      const updated = await q(
        `UPDATE transfer_requests
           SET status = $1, admin_note = $2, decided_at = NOW(), decided_by_id = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING ${TRANSFER_SELECT}`,
        [body.decision, body.adminNote ?? null, admin.id, id]
      );
      return updated[0];
    });

    return ok({
      transfer,
      message:
        body.decision === "APPROUVE"
          ? "Transfert validé : le solde du client a été débité. Finalisez l'envoi vers le bénéficiaire puis contactez le client."
          : "Demande de transfert refusée.",
    });
  }
);
