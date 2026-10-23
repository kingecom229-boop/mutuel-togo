import { ApiError, ok, route } from "@/server/http";
import { requireAdmin, findUserById, publicUser } from "@/server/auth";
import { query } from "@/server/db";
import { getProfileViewForUser } from "@/server/services/profile";
import { LOAN_SELECT, TRANSACTION_SELECT, TRANSFER_SELECT } from "@/server/selects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/utilisateurs/[id] — dossier complet d'un client. */
export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await context.params;
    const client = await findUserById(id);
    if (!client || client.role !== "USER") throw new ApiError(404, "Client introuvable.");

    const [view, loans, transfers, transactions] = await Promise.all([
      getProfileViewForUser(client),
      query(`SELECT ${LOAN_SELECT} FROM loan_requests WHERE user_id = $1 ORDER BY created_at DESC`, [id]),
      query(`SELECT ${TRANSFER_SELECT} FROM transfer_requests WHERE user_id = $1 ORDER BY created_at DESC`, [id]),
      query(`SELECT ${TRANSACTION_SELECT} FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [id]),
    ]);

    return ok({
      user: publicUser(client),
      profile: view.profile,
      percent: view.percent,
      status: view.status,
      missingLabels: view.missingLabels,
      loans,
      transfers,
      transactions,
    });
  }
);
