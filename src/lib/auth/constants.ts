/** Super-admin storefront + future admin panel (Google account). */
export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "paletot.business@gmail.com"
)
  .trim()
  .toLowerCase();

/** Optional comma-separated staff emails (Google). */
export const STAFF_EMAILS = (process.env.STAFF_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function roleForEmail(email: string | null | undefined): "admin" | "staff" | "customer" {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return "customer";
  if (e === ADMIN_EMAIL) return "admin";
  if (STAFF_EMAILS.includes(e)) return "staff";
  return "customer";
}
