/**
 * Search HTTP client — FastAPI GET /api/v1/search.
 */

import { getApiBaseUrl } from "@/lib/api/config";
import { normalizeProduct } from "@/lib/api/catalog";
import type { Product } from "@/types/product";

export class SearchApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "request_failed" | "invalid_response" = "request_failed",
  ) {
    super(message);
    this.name = "SearchApiError";
  }
}

export type SearchResponse = {
  query: string;
  items: Product[];
  total: number;
};

async function parseSearchError(res: Response): Promise<SearchApiError> {
  let message = res.statusText || "Search failed";
  try {
    const body = (await res.json()) as {
      detail?: string | { message?: string };
    };
    if (typeof body.detail === "string") message = body.detail;
    else if (body.detail && typeof body.detail === "object") {
      message = body.detail.message ?? message;
    }
  } catch {
    /* ignore */
  }
  return new SearchApiError(message, res.status, "request_failed");
}

/**
 * GET /api/v1/search?q=&limit=
 * Empty query → empty items (BE also returns empty).
 */
export async function fetchSearch(
  q: string,
  limit = 6,
): Promise<SearchResponse> {
  const query = q.trim();
  const safeLimit = Math.min(24, Math.max(1, limit));

  if (!query) {
    return { query: "", items: [], total: 0 };
  }

  const qs = new URLSearchParams({
    q: query,
    limit: String(safeLimit),
  });

  const url = `${getApiBaseUrl()}/api/v1/search?${qs.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw await parseSearchError(res);

  const json = (await res.json()) as Record<string, unknown>;
  if (!Array.isArray(json.items)) {
    throw new SearchApiError(
      "Invalid search response",
      res.status,
      "invalid_response",
    );
  }

  const items = json.items.map((p) =>
    normalizeProduct(p as Record<string, unknown>),
  );

  return {
    query: String(json.query ?? query),
    items,
    total: Number(json.total ?? items.length),
  };
}
