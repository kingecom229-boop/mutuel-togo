import { randomUUID } from "node:crypto";
import { ApiError, ok, readJson, route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { query } from "@/server/db";
import { transferSchema } from "@/server/validation";
import { getWalletInfo } from "@/server/services/wallet";
import { TRANSFER_SELECT } from "@/server/selects";
import { formatFcfa } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const [transfers, wallet] = await Promise.all([
    query(
      `SELECT ${TRANSFER_SELECT} FROM transfer_requests
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    ),
    getWalletInfo(user.id),
  ]);
  return ok({ transfers, WalletInfo: wallet });
});

/**
 * POST /api/transferts — initie un transfert sans API externe.
 * Le solde n'est débité qu'après validation par l'admin.
 */
export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const body = transferSchema.parse(await readJson(request));

  const wallet = await getWalletInfo(user.id);
  if (body.amountFcfa > wallet.availableFcfa) {
    const explication =
      wallet.bonusLockedFcfa > 0
        ? ` Votre bonus de bienvenue de ${formatFcfa(wallet.bonusLockedFcfa)} devient retirable après votre premier crédit accordé.`
        : "";
    throw new ApiError(
      400,
      `Solde disponible insuffisant. Vous pouvez transférer au maximum ${formatFcfa(wallet.availableFcfa)} (solde ${formatFcfa(wallet.balanceFcfa)}, transferts en attente ${formatFcfa(wallet.pendingTransfersFcfa)}).${explication}`
    );
  }

  const id = randomUUID();
  await query(
    `INSERT INTO transfer_requests
       (id, user_id, channel, provider, destination_name, destination_number, amount_fcfa, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'EN_ATTENTE')`,
    [
      id,
      user.id,
      body.channel,
      body.provider,
      body.destinationName,
      body.destinationNumber,
      body.amountFcfa,
    ]
  );

  const transfers = await query(
    `SELECT ${TRANSFER_SELECT} FROM transfer_requests WHERE id = $1`,
    [id]
  );
  return ok(
    {
      transfer: transfers[0],
      message: `Félicitations ! Votre transfert de ${formatFcfa(body.amountFcfa)} a bien été initié vers ${body.destinationName} (${body.destinationNumber}). La direction vous contactera pour finaliser le transfert.`,
    },
    201
  );
});
