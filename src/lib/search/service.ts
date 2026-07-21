/**
 * Product search facade (header autocomplete).
 *
 * Default: FastAPI GET /api/v1/search.
 * Rollback: same flag as catalog — `NEXT_PUBLIC_USE_API_CATALOG=0`.
 */

import { isApiCatalogEnabled } from "@/lib/api/config";
import { fetchSearch, SearchApiError } from "@/lib/api/search";
import { searchProducts as mockSearchProducts } from "@/lib/mock/products";
import type { Product } from "@/types/product";
export type SearchResult = {
  query: string;
  items: Product[];
  total: number;
};

/**
 * Lightweight catalog search for header autocomplete.
 * Always returns a stable shape; empty query → empty items.
 */
export async function searchCatalog(
  query: string,
  limit = 6,
): Promise<SearchResult> {
  const q = query.trim();
  if (!q) {
    return { query: "", items: [], total: 0 };
  }

  if (!isApiCatalogEnabled()) {
    const items = mockSearchProducts(q, limit);
    return { query: q, items, total: items.length };
  }

  return fetchSearch(q, limit);
}

export { SearchApiError };
