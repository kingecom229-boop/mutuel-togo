import { ok, readJson, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";
import { rateUpdateSchema } from "@/server/validation";
import { getAnnualRate } from "@/server/services/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Paramètres back-office : taux annuel appliqué aux nouvelles demandes. */
export const GET = route(async () => {
  await requireAdmin();
  return ok({ annualRatePercent: await getAnnualRate() });
});

export const PATCH = route(async (request: Request) => {
  await requireAdmin();
  const body = rateUpdateSchema.parse(await readJson(request));
  await query(
    `UPDATE settings SET annual_rate_percent = $1, updated_at = NOW() WHERE id = 1`,
    [body.annualRatePercent]
  );
  return ok({
    annualRatePercent: body.annualRatePercent,
    message: "Taux mis à jour. Il s'appliquera aux nouvelles demandes de crédit.",
  });
});
