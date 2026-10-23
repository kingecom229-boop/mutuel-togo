import { randomUUID } from "node:crypto";
import { ApiError, ok, route } from "@/server/http";
import { requireAdmin, findUserById, publicUser } from "@/server/auth";
import { query } from "@/server/db";
import { saveUploadedFile } from "@/server/storage";
import { MESSAGE_SELECT } from "@/server/selects";
import { FICHIER_USAGES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function clientOr404(userId: string) {
  const client = await findUserById(userId);
  if (!client || client.role !== "USER") throw new ApiError(404, "Client introuvable.");
  return client;
}

export const GET = route(
  async (_request: Request, context: { params: Promise<{ userId: string }> }) => {
    await requireAdmin();
    const { userId } = await context.params;
    const client = await clientOr404(userId);
    await query(
      `UPDATE messages SET read_by_admin = TRUE
       WHERE conversation_user_id = $1 AND sender_role = 'USER' AND NOT read_by_admin`,
      [userId]
    );
    const messages = await query(
      `SELECT ${MESSAGE_SELECT} FROM messages
       WHERE conversation_user_id = $1 ORDER BY created_at ASC LIMIT 300`,
      [userId]
    );
    return ok({ client: publicUser(client), messages });
  }
);

export const POST = route(
  async (request: Request, context: { params: Promise<{ userId: string }> }) => {
    const admin = await requireAdmin();
    const { userId } = await context.params;
    await clientOr404(userId);

    const contentType = request.headers.get("content-type") ?? "";
    let content = "";
    let attachmentFileId: string | null = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      content = String(form.get("content") ?? "").trim();
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        const saved = await saveUploadedFile({
          ownerId: admin.id,
          purpose: FICHIER_USAGES.MESSAGE,
          file,
        });
        attachmentFileId = saved.id;
      }
    } else {
      const body = (await request.json().catch(() => ({}))) as { content?: unknown };
      content = String(body.content ?? "").trim();
    }
    if (!content && !attachmentFileId)
      throw new ApiError(400, "Écrivez un message ou joignez un fichier.");
    if (content.length > 4000)
      throw new ApiError(400, "Message trop long (4 000 caractères max).");

    const id = randomUUID();
    await query(
      `INSERT INTO messages
         (id, conversation_user_id, sender_id, sender_role, content, attachment_file_id, read_by_user, read_by_admin)
       VALUES ($1,$2,$3,'ADMIN',$4,$5,FALSE,TRUE)`,
      [id, userId, admin.id, content, attachmentFileId]
    );
    const messages = await query(`SELECT ${MESSAGE_SELECT} FROM messages WHERE id = $1`, [id]);
    return ok({ message: messages[0] }, 201);
  }
);
