import { ApiError, ok, readJson, route } from "@/server/http";
import { requireAdmin, hashPassword, verifyPassword } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { changePasswordSchema } from "@/server/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/admin/mot-de-passe — l'admin change son mot de passe depuis son profil. */
export const POST = route(async (request: Request) => {
  const admin = await requireAdmin();
  const body = changePasswordSchema.parse(await readJson(request));

  const row = await queryOne<{ passwordHash: string }>(
    `SELECT password_hash AS "passwordHash" FROM users WHERE id = $1`,
    [admin.id]
  );
  if (!row || !(await verifyPassword(body.currentPassword, row.passwordHash))) {
    throw new ApiError(400, "Le mot de passe actuel est incorrect.");
  }

  const nouveauHash = await hashPassword(body.newPassword);
  await query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
    nouveauHash,
    admin.id,
  ]);
  return ok({ message: "Mot de passe administrateur mis à jour." });
});
