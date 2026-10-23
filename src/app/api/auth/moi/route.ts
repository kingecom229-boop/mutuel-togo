import { ok, route } from "@/server/http";
import { getCurrentUser, publicUser } from "@/server/auth";
import { getProfileViewForUser } from "@/server/services/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/moi — utilisateur de la session en cours (ou null). */
export const GET = route(async () => {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null });
  if (user.role === "ADMIN") return ok({ user: publicUser(user), profile: null });
  const view = await getProfileViewForUser(user);
  return ok({
    user: publicUser(user),
    profile: { percent: view.percent, status: view.status },
  });
});
