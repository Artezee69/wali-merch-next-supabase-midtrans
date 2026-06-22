/**
 * Phone-number normalization, shared by client form, server-side
 * check API, and database.
 *
 * The Postgres column `phone_norm` is defined as
 *   regexp_replace(coalesce(phone,''), '\D', '', 'g')
 * and the JavaScript helper below MUST produce the same result,
 * otherwise the in-app duplicate check will disagree with the
 * database's unique index.
 */

export function normalizePhone(input: string | null | undefined): string {
  if (!input) return "";
  return String(input).replace(/\D/g, "");
}

/**
 * Very lightweight shape check — not a strict E.164 validator.
 * We allow 8–15 digits, which is the E.164 length range.
 */
export function isValidPhone(input: string | null | undefined): boolean {
  const norm = normalizePhone(input);
  return /^[0-9]{8,15}$/.test(norm);
}

/**
 * Best-effort canonical display form. Indonesian numbers get
 * `+62`; everything else is shown with the raw normalized
 * digits. Used for "we found this on file" hints only.
 */
export function prettyPhone(input: string | null | undefined): string {
  const norm = normalizePhone(input);
  if (!norm) return "";
  if (norm.startsWith("62")) return `+${norm}`;
  if (norm.startsWith("0")) return `+62${norm.slice(1)}`;
  return `+${norm}`;
}
