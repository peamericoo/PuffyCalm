import type { CatalogSort, StockFilter } from "@/lib/catalog/types";

/**
 * Build / parse catalog query strings — single place for URL contract.
 */

export type CatalogUrlState = {
  q: string;
  sort: CatalogSort;
  stock: StockFilter;
  types: string[];
  sale: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
};

export function parseTypesParam(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const s = Array.isArray(raw) ? raw.join(",") : raw;
  return s
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function catalogSearchParams(state: Partial<CatalogUrlState>): string {
  const params = new URLSearchParams();
  const q = state.q?.trim();
  if (q) params.set("q", q.slice(0, 80));
  if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
  if (state.stock && state.stock !== "all") params.set("stock", state.stock);
  if (state.types && state.types.length > 0) {
    params.set("types", state.types.join(","));
  }
  if (state.sale) params.set("sale", "1");
  if (typeof state.minPrice === "number" && Number.isFinite(state.minPrice)) {
    params.set("min", String(Math.max(0, Math.floor(state.minPrice))));
  }
  if (typeof state.maxPrice === "number" && Number.isFinite(state.maxPrice)) {
    params.set("max", String(Math.max(0, Math.floor(state.maxPrice))));
  }
  if (state.page && state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

export function catalogHref(
  categorySlug: string,
  state: Partial<CatalogUrlState>,
): string {
  const qs = catalogSearchParams(state);
  const base = `/category/${categorySlug}`;
  return qs ? `${base}?${qs}` : base;
}
