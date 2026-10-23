import { ApiError, ok, readJson, route } from "@/server/http";
import { requireUser, publicUser, findUserById } from "@/server/auth";
import { query, withTransaction } from "@/server/db";
import { profileUpdateSchema } from "@/server/validation";
import { getProfileViewForUser, recomputeProfile } from "@/server/services/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  const view = await getProfileViewForUser(user);
  return ok({ user: publicUser(user), ...view });
});

/** PATCH /api/profil — mise à jour des informations KYC puis recalcul du score. */
export const PATCH = route(async (request: Request) => {
  const user = await requireUser();
  const body = profileUpdateSchema.parse(await readJson(request));

  const email = body.email === "" ? undefined : body.email;
  if (email && email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    const conflict = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 AND id <> $2`,
      [email.toLowerCase(), user.id]
    );
    if (conflict.length > 0) {
      throw new ApiError(409, "Cette adresse email est déjà utilisée par un autre compte.");
    }
  }

  const view = await withTransaction(async (q) => {
    if (body.fullName !== undefined || email !== undefined) {
      await q(
        `UPDATE users SET full_name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
        [body.fullName ?? user.fullName, email ? email.toLowerCase() : user.email, user.id]
      );
    }

    const champs: Array<[string, unknown]> = [];
    if (body.dateOfBirth !== undefined) champs.push(["date_of_birth", body.dateOfBirth]);
    if (body.address !== undefined) champs.push(["address", body.address]);
    if (body.city !== undefined) champs.push(["city", body.city]);
    if (body.profession !== undefined) champs.push(["profession", body.profession]);
    if (body.monthlyIncomeFcfa !== undefined)
      champs.push(["monthly_income_fcfa", body.monthlyIncomeFcfa]);
    if (body.witnessName !== undefined) champs.push(["witness_name", body.witnessName]);
    if (body.witnessRelation !== undefined)
      champs.push(["witness_relation", body.witnessRelation]);
    if (body.witnessPhone !== undefined) champs.push(["witness_phone", body.witnessPhone]);

    if (champs.length > 0) {
      const sets = champs.map(([column], i) => `${column} = $${i + 1}`).join(", ");
      const values = champs.map(([, value]) => value ?? null);
      await q(
        `UPDATE profiles SET ${sets}, updated_at = NOW() WHERE user_id = $${values.length + 1}`,
        [...values, user.id]
      );
    }

    const fresh = await q<Parameters<typeof publicUser>[0]>(
      `SELECT id, full_name AS "fullName", phone, email, role,
              balance_fcfa AS "balanceFcfa", is_active AS "isActive",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM users WHERE id = $1`,
      [user.id]
    );
    const recomputed = await recomputeProfile(q, fresh[0] ?? user);
    return { ...recomputed, freshUser: fresh[0] ?? user };
  });

  const freshUser = (await findUserById(user.id)) ?? view.freshUser;
  return ok({
    user: publicUser(freshUser as Parameters<typeof publicUser>[0]),
    profile: view.profile,
    percent: view.percent,
    status: view.status,
    missingLabels: view.missingLabels,
    completedLabels: view.completedLabels,
    message:
      view.status === "APPROUVE"
        ? "Félicitations ! Votre profil est APPROUVÉ à 100 % : vous pouvez demander un crédit."
        : `Profil enregistré : ${view.percent} % complété.`,
  });
});
