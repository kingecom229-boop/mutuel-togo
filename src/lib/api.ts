/**
 * Petit client API du frontend.
 * Le navigateur envoie automatiquement le cookie de session httpOnly.
 * Toutes les réponses suivent le format { data } ou { error } du backend.
 */

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function handle<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new ApiClientError(
      payload.error ?? "Une erreur est survenue. Réessayez.",
      response.status,
      payload.details
    );
  }
  return payload.data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: "GET", cache: "no-store" });
  return handle<T>(response);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(response);
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(path, { method: "POST", body: form });
  return handle<T>(response);
}
