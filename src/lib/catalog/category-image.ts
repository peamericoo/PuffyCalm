/**
 * Category visuals for Shop by Mood / Filters.
 * Rejects seed stock photography so the storefront stays clean until you
 * set real category images (today: DB; later: admin category editor).
 */

export function isDemoStockImage(url: string | undefined | null): boolean {
  if (!url?.trim()) return true;
  const u = url.toLowerCase();
  return (
    u.includes("unsplash.com") ||
    u.includes("picsum.photos") ||
    u.includes("placeholder")
  );
}

/** Real merch URL or null (UI uses brand gradient / icon). */
export function categoryDisplayImage(
  url: string | undefined | null,
): string | null {
  if (!url?.trim() || isDemoStockImage(url)) return null;
  return url.trim();
}
