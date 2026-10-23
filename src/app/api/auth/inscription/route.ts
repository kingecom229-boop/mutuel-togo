import { randomUUID } from "node:crypto";
import { withTransaction } from "@/server/db";
import { ApiError, ok, readJson, route } from "@/server/http";
import { registerSchema } from "@/server/validation";
import { createSession, findUserByPhone, hashPassword, publicUser } from "@/server/auth";
import { recomputeProfile } from "@/server/services/profile";
import { newReference } from "@/server/references";
import { BONUS_BIENVENUE_FCFA, TRANSACTION_TYPES } from "@/lib/constants";

export const runtime = "nodejs";

/** POST /api/auth/inscription — creation de compte + bonus de bienvenue 500 FCFA. */
export const POST = route(async (request: Request) => {
  const body = registerSchema.parse(await readJson(request));

  const existing = await findUserByPhone(body.phone);
  if (existing) {
    throw new ApiError(
      409,
      "Un compte existe déjà avec ce numéro. Connectez-vous plutôt."
    );
  }

  const passwordHash = await hashPassword(body.password);
  const userId = randomUUID();

  const user = await withTransaction(async (q) => {
    await q(
      `INSERT INTO users (id, full_name, phone, password_hash, role, balance_fcfa)
       VALUES ($1, $2, $3, $4, 'USER', $5)`,
      [userId, body.fullName, body.phone, passwordHash, BONUS_BIENVENUE_FCFA]
    );
    await q(
      `INSERT INTO transactions
         (id, user_id, reference, type, label, amount_fcfa, balance_after_fcfa)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        randomUUID(),
        userId,
        newReference("BONUS"),
        TRANSACTION_TYPES.BONUS,
        "Bonus de bienvenue MUTUEL TOGO",
        BONUS_BIENVENUE_FCFA,
        BONUS_BIENVENUE_FCFA,
      ]
    );
    const rows = await q<{
      id: string; fullName: string; phone: string; email: string | null;
      role: string; balanceFcfa: number; isActive: boolean; createdAt: string; updatedAt: string;
    }>(
      `SELECT id, full_name AS "fullName", phone, email, role,
              balance_fcfa AS "balanceFcfa", is_active AS "isActive",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE id = $1`,
      [userId]
    );
    const created = rows[0];
    const view = await recomputeProfile(q, created);
    return { ...created, _profile: view };
  });

  await createSession({ id: user.id, role: user.role });
  const { _profile, ...sessionUser } = user;
  return ok(
    {
      user: publicUser(sessionUser),
      profile: {
        percent: _profile.percent,
        status: _profile.status,
        missingLabels: _profile.missingLabels,
      },
      message: "Compte créé avec succès. Bonus de bienvenue de 500 FCFA crédité.",
    },
    201
  );
});
