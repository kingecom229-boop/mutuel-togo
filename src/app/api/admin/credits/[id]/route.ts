import { randomUUID } from "node:crypto";
import { ApiError, ok, readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { decisionSchema } from "@/server/validation";
import { newReference } from "@/server/references";
import { LOAN_SELECT } from "@/server/selects";
import { TRANSACTION_TYPES } from "@/lib/constants";
import { formatFcfa } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/credits/[id]
 * APPROUVE : le montant est crédité sur le solde du client + historique (transaction atomique).
 * REFUSE   : aucun mouvement d'argent.
 */
export const PATCH = route(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = decisionSchema.parse(await readJson(request));

    const loan = await withTransaction(async (q) => {
      const loans = await q<{
        id: string; userId: string; amountFcfa: number; status: string;
      }>(
        `SELECT id, user_id AS "userId", amount_fcfa AS "amountFcfa", status
         FROM loan_requests WHERE id = $1 FOR UPDATE`,
        [id]
      );
      const current = loans[0];
      if (!current) throw new ApiError(404, "Demande de crédit introuvable.");
      if (current.status !== "EN_ATTENTE") {
        throw new ApiError(409, "Cette demande a déjà été traitée.");
      }

      if (body.decision === "APPROUVE") {
        const users = await q<{ balanceFcfa: number }>(
          `SELECT balance_fcfa AS "balanceFcfa" FROM users WHERE id = $1 FOR UPDATE`,
          [current.userId]
        );
        const nouveauSolde = (users[0]?.balanceFcfa ?? 0) + current.amountFcfa;
        await q(
          `UPDATE users SET balance_fcfa = $1, updated_at = NOW() WHERE id = $2`,
          [nouveauSolde, current.userId]
        );
        await q(
          `INSERT INTO transactions
             (id, user_id, reference, type, label, amount_fcfa, balance_after_fcfa, loan_request_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            randomUUID(),
            current.userId,
            newReference("CREDIT"),
            TRANSACTION_TYPES.CREDIT,
            `Crédit accordé de ${formatFcfa(current.amountFcfa)}`,
            current.amountFcfa,
            nouveauSolde,
            current.id,
          ]
        );
      }

      const updated = await q(
        `UPDATE loan_requests
           SET status = $1, admin_note = $2, decided_at = NOW(), decided_by_id = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING ${LOAN_SELECT}`,
        [body.decision, body.adminNote ?? null, admin.id, id]
      );
      return updated[0];
    });

    return ok({
      loan,
      message:
        body.decision === "APPROUVE"
          ? "Crédit approuvé : le montant a été crédité sur le solde du client."
          : "Demande de crédit refusée.",
    });
  }
);
