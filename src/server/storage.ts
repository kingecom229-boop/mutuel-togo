/**
 * Stockage prive des fichiers utilisateurs (portrait, CNI, pieces jointes).
 * - Mode local : dossier UPLOAD_DIR (defaut ./uploads), hors dossier public.
 * - Le fichier n'est servi que par /api/fichiers/[id] apres controle d'acces.
 * - Pour le cloud : implementez la meme interface dans ce module
 *   (STORAGE_DRIVER=cloud) sans toucher au reste du code.
 */
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { query, queryOne } from "./db";
import { ApiError } from "./http";

export interface UploadedFileRow {
  id: string;
  ownerId: string;
  purpose: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storageDriver: string;
  storagePath: string;
  createdAt: string;
}

const FILE_SELECT = `
  id, owner_id AS "ownerId", purpose, original_name AS "originalName",
  stored_name AS "storedName", mime_type AS "mimeType", size_bytes AS "sizeBytes",
  storage_driver AS "storageDriver", storage_path AS "storagePath", created_at AS "createdAt"`;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

function uploadRoot(): string {
  const dir = (process.env.UPLOAD_DIR ?? "./uploads").trim() || "./uploads";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

function maxUploadBytes(): number {
  const value = Number(process.env.MAX_UPLOAD_BYTES ?? 5_242_880);
  return Number.isFinite(value) && value > 0 ? value : 5_242_880;
}

export async function saveUploadedFile(params: {
  ownerId: string;
  purpose: string;
  file: File;
}): Promise<UploadedFileRow> {
  const driver = (process.env.STORAGE_DRIVER ?? "local").trim().toLowerCase();
  if (driver !== "local") {
    throw new ApiError(
      501,
      "Le stockage cloud n'est pas encore configuré sur ce serveur (STORAGE_DRIVER=local attendu)."
    );
  }
  const { ownerId, purpose, file } = params;
  const extension = MIME_EXTENSIONS[file.type];
  if (!extension) {
    throw new ApiError(400, "Format non accepté : utilisez une photo JPG, PNG, WEBP ou un PDF.");
  }
  if (file.size === 0) throw new ApiError(400, "Le fichier est vide.");
  if (file.size > maxUploadBytes()) {
    throw new ApiError(
      400,
      `Fichier trop volumineux : ${(maxUploadBytes() / 1024 / 1024).toFixed(0)} Mo maximum.`
    );
  }

  const id = randomUUID();
  const storedName = `${id}${extension}`;
  const root = uploadRoot();
  await fs.mkdir(root, { recursive: true });
  const absolutePath = path.join(root, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  const originalName = (file.name || `fichier${extension}`).slice(0, 200);
  await query(
    `INSERT INTO uploaded_files
      (id, owner_id, purpose, original_name, stored_name, mime_type, size_bytes, storage_driver, storage_path)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'local',$8)`,
    [id, ownerId, purpose, originalName, storedName, file.type, file.size, storedName]
  );
  const row = await getFileById(id);
  if (!row) throw new ApiError(500, "Le fichier n'a pas pu être enregistré.");
  return row;
}

export async function getFileById(id: string): Promise<UploadedFileRow | null> {
  return queryOne<UploadedFileRow>(
    `SELECT ${FILE_SELECT} FROM uploaded_files WHERE id = $1`,
    [id]
  );
}

export function readFileStream(row: UploadedFileRow) {
  const absolutePath = path.join(uploadRoot(), path.basename(row.storagePath));
  if (!fssync.existsSync(absolutePath)) {
    throw new ApiError(404, "Fichier introuvable sur le serveur.");
  }
  return fssync.createReadStream(absolutePath);
}

export async function readFileBuffer(row: UploadedFileRow): Promise<Buffer> {
  const absolutePath = path.join(uploadRoot(), path.basename(row.storagePath));
  try {
    return await fs.readFile(absolutePath);
  } catch {
    throw new ApiError(404, "Fichier introuvable sur le serveur.");
  }
}
