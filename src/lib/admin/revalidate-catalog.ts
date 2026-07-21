/**
 * Catalog cache invalidation after admin product mutations (Phase H).
 *
 * Storefront fetches use Next tags: `catalog`, `catalog:{slug}`,
 * `categories`, `product:{slug}` (+ page `revalidate = 60` ISR fallback).
 * This helper POSTs to the Next route handler which calls revalidateTag/Path.
 */

export type RevalidateCatalogInput = {
  /** Product slug(s) touched (old + new if slug changed). */
  productSlugs?: string[];
  /** Category slugs linked (optional; always revalidates catalog root). */
  categorySlugs?: string[];
};

export type RevalidateCatalogResult = {
  ok: boolean;
  revalidated?: { tags: string[]; paths: string[] };
  error?: string;
};

/**
 * Fire-and-forget friendly: returns result; never throws for network blips
 * unless you check `ok`. Safe to call from client after product save.
 */
export async function revalidateCatalog(
  input: RevalidateCatalogInput = {},
): Promise<RevalidateCatalogResult> {
  try {
    const res = await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productSlugs: input.productSlugs ?? [],
        categorySlugs: input.categorySlugs ?? [],
      }),
    });
    const data = (await res.json().catch(() => ({}))) as RevalidateCatalogResult & {
      message?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || data.message || `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      revalidated: data.revalidated,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Revalidate request failed",
    };
  }
}
