import { ApiError, ok, readJson, route } from "@/server/http";
import { loginSchema } from "@/server/validation";
import {
  createSession,
  findUserByPhone,
  publicUser,
  verifyPassword,
} from "@/server/auth";
import {
  assertLoginAllowed,
  clearLoginFailures,
  identifierFromRequest,
  recordLoginFailure,
} from "@/server/rate-limit";
import { ROLES } from "@/lib/constants";

export const runtime = "nodejs";

/** POST /api/auth/connexion — téléphone togolais + mot de passe. */
export const POST = route(async (request: Request) => {
  const body = loginSchema.parse(await readJson(request));
  const key = identifierFromRequest(request, `user:${body.phone}`);
  assertLoginAllowed(key);

  const user = await findUserByPhone(body.phone);
  const valide =
    user && user.role === ROLES.USER && user.isActive
      ? await verifyPassword(body.password, user.passwordHash)
      : false;

  if (!valide || !user) {
    recordLoginFailure(key);
    throw new ApiError(401, "Numéro ou mot de passe incorrect.");
  }
  clearLoginFailures(key);
  await createSession({ id: user.id, role: user.role });
  return ok({ user: publicUser(user) });
});
