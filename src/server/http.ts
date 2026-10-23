import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Erreur metier renvoyee proprement au client (message en francais). */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function fail(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details ?? undefined },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return NextResponse.json(
      {
        error: first ? first.message : "Données invalides.",
        details: error.issues.map((i) => ({ champ: i.path.join("."), message: i.message })),
      },
      { status: 400 }
    );
  }
  console.error("[api] Erreur inattendue :", error);
  return NextResponse.json(
    { error: "Une erreur interne est survenue. Réessayez dans un instant." },
    { status: 500 }
  );
}

/** Enveloppe un gestionnaire de route API avec la gestion d'erreurs commune. */
export function route<I extends unknown[]>(
  handler: (...args: I) => Promise<Response>
): (...args: I) => Promise<Response> {
  return async (...args: I) => {
    try {
      return await handler(...args);
    } catch (error) {
      return fail(error);
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Corps de requête JSON invalide.");
  }
}
