/** Public API base (gateway). No secrets. */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

export function getStripePublishableKey(): string {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

/**
 * Storefront catalog/reviews/search from FastAPI (default ON).
 * Set NEXT_PUBLIC_USE_API_CATALOG=0|false|off|no to force mock fixtures.
 */
export function isApiCatalogEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_USE_API_CATALOG?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  return true;
}
