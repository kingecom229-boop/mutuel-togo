import { ApiError, ok, readJson, route } from "@/server/http";
import { adminLoginSchema } from "@/server/validation";
import {
  createSession,
  findUserByEmail,
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

/** POST /api/auth/admin-connexion — email + mot de passe administrateur. */
export const POST = route(async (request: Request) => {
  const body = adminLoginSchema.parse(await readJson(request));
  const key = identifierFromRequest(request, `admin:${body.email}`);
  assertLoginAllowed(key);

  const user = await findUserByEmail(body.email);
  const valide =
    user && user.role === ROLES.ADMIN && user.isActive
      ? await verifyPassword(body.password, user.passwordHash)
      : false;

  if (!valide || !user) {
    recordLoginFailure(key);
    throw new ApiError(401, "Identifiants administrateur incorrects.");
  }
  clearLoginFailures(key);
  await createSession({ id: user.id, role: user.role });
  return ok({ user: publicUser(user) });
});
