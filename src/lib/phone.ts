/**
 * Numeros togolais : indicatif +228 suivi de 8 chiffres.
 * Formes acceptees : "98 00 01 01", "98000101", "+22898000101",
 * "22898000101", "0022898000101".
 * La forme normalisee stockee en base est toujours "+228XXXXXXXX".
 */
export function normalizeTogoPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = String(input).replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00228")) digits = digits.slice(5);
  else if (/^228\d{8}$/.test(digits)) digits = digits.slice(3);
  if (!/^[2-9]\d{7}$/.test(digits)) return null;
  return `+228${digits}`;
}

export function isValidTogoPhone(input: string | null | undefined): boolean {
  return normalizeTogoPhone(input) !== null;
}

/** "+22898000101" -> "+228 98 00 01 01" */
export function formatTogoPhone(phone: string | null | undefined): string {
  const normalized = normalizeTogoPhone(phone);
  if (!normalized) return phone ?? "";
  const local = normalized.slice(4);
  return `+228 ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)}`;
}

/** Masque partiel pour la carte virtuelle : +228 98 ** ** 01 */
export function maskTogoPhone(phone: string | null | undefined): string {
  const normalized = normalizeTogoPhone(phone);
  if (!normalized) return phone ?? "";
  const local = normalized.slice(4);
  return `+228 ${local.slice(0, 2)} ** ** ${local.slice(6, 8)}`;
}
