/**
 * Limitation simple des tentatives de connexion (en memoire).
 * Suffisante pour une instance unique ; en production multi-instance,
 * branchez un stockage partage (Redis/PostgreSQL) derriere cette interface.
 */
import { ApiError } from "./http";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const FENETRE_MS = 15 * 60 * 1000;
const MAX_TENTATIVES = 10;

export function identifierFromRequest(request: Request, suffix: string): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "local";
  return `${ip}:${suffix}`.toLowerCase();
}

export function assertLoginAllowed(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt > now && bucket.count >= MAX_TENTATIVES) {
    throw new ApiError(
      429,
      "Trop de tentatives de connexion. Réessayez dans quelques minutes."
    );
  }
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + FENETRE_MS });
  } else {
    bucket.count += 1;
  }
}

export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}
