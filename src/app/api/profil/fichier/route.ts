import { ApiError, ok, route } from "@/server/http";
import { requireUser, publicUser } from "@/server/auth";
import { withTransaction } from "@/server/db";
import { saveUploadedFile } from "@/server/storage";
import { ensureProfile, recomputeProfile } from "@/server/services/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USAGE_TO_COLUMN: Record<string, string> = {
  PORTRAIT: "portrait_file_id",
  CNI_RECTO: "cni_front_file_id",
  CNI_VERSO: "cni_back_file_id",
};

/** POST /api/profil/fichier (multipart : usage + file) — portrait ou CNI. */
export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const form = await request.formData().catch(() => null);
  const usage = String(form?.get("usage") ?? "");
  const column = USAGE_TO_COLUMN[usage];
  const file = form?.get("file");
  if (!column) throw new ApiError(400, "Type de document invalide.");
  if (!(file instanceof File)) throw new ApiError(400, "Aucun fichier reçu.");

  const saved = await saveUploadedFile({ ownerId: user.id, purpose: usage, file });

  const view = await withTransaction(async (q) => {
    await ensureProfile(q, user.id);
    await q(
      `UPDATE profiles SET ${column} = $1, updated_at = NOW() WHERE user_id = $2`,
      [saved.id, user.id]
    );
    return recomputeProfile(q, user);
  });

  return ok(
    {
      user: publicUser(user),
      profile: view.profile,
      percent: view.percent,
      status: view.status,
      missingLabels: view.missingLabels,
      file: { id: saved.id, purpose: saved.purpose, mimeType: saved.mimeType },
      message:
        view.status === "APPROUVE"
          ? "Document enregistré. Votre profil est maintenant APPROUVÉ à 100 % !"
          : `Document enregistré. Profil complété à ${view.percent} %.`,
    },
    201
  );
});
