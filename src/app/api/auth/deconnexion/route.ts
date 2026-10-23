import { ok, route } from "@/server/http";
import { destroySession } from "@/server/auth";

export const runtime = "nodejs";

export const POST = route(async () => {
  await destroySession();
  return ok({ message: "Session fermée." });
});
