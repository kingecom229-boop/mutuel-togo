import { ApiError, route } from "@/server/http";
import { getCurrentUser } from "@/server/auth";
import { queryOne } from "@/server/db";
import { getFileById, readFileBuffer } from "@/server/storage";
import { ROLES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/fichiers/[id] — téléchargement privé d'un document.
 * Accès : propriétaire, administrateur, ou client de la conversation
 * lorsque le fichier est une piece jointe envoyee par l'admin.
 */
export const GET = route(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser();
    if (!user) throw new ApiError(401, "Session expirée. Reconnectez-vous.");
    const { id } = await context.params;
    const file = await getFileById(id);
    if (!file) throw new ApiError(404, "Document introuvable.");

    let allowed = user.role === ROLES.ADMIN || file.ownerId === user.id;
    if (!allowed && file.purpose === "MESSAGE") {
      const link = await queryOne(
        `SELECT id FROM messages WHERE attachment_file_id = $1 AND conversation_user_id = $2 LIMIT 1`,
        [file.id, user.id]
      );
      allowed = Boolean(link);
    }
    if (!allowed) throw new ApiError(403, "Accès interdit à ce document.");

    const buffer = await readFileBuffer(file);
    const safeName = file.originalName.replace(/["\r\n]/g, "_");
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
);
