import { ok, route } from "@/server/http";
import { requireAdmin } from "@/server/auth";
import { query } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/messages — conversations clients (dernier message + non lus). */
export const GET = route(async () => {
  await requireAdmin();
  const conversations = await query(
    `SELECT
       u.id AS "userId", u.full_name AS "fullName", u.phone,
       dernier.content AS "lastContent", dernier.sender_role AS "lastSenderRole",
       dernier.created_at AS "lastAt", dernier.attachment_file_id AS "lastAttachmentId",
       (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_user_id = u.id AND m.sender_role = 'USER' AND NOT m.read_by_admin)::int AS "unread"
     FROM users u
     LEFT JOIN LATERAL (
       SELECT content, sender_role, created_at, attachment_file_id
       FROM messages WHERE conversation_user_id = u.id
       ORDER BY created_at DESC LIMIT 1
     ) dernier ON TRUE
     WHERE u.role = 'USER'
     ORDER BY dernier.created_at DESC NULLS LAST, u.created_at DESC`
  );
  return ok({ conversations });
});
