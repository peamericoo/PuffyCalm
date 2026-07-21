/**
 * Product search facade (header autocomplete) — FastAPI only (Phase M).
 *
 * GET /api/v1/search
 */

import { fetchSearch, SearchApiError } from "@/lib/api/search";
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

  return fetchSearch(q, limit);
}

export { SearchApiError };
