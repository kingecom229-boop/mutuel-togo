import { randomUUID } from "node:crypto";

/** Reference unique lisible d'une operation financiere, ex : MT-CREDIT-8F3K2Q9A */
export function newReference(prefix: string): string {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `MT-${prefix}-${suffix}`;
}
