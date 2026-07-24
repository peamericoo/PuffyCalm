"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  isCatalogSort,
  isStockFilter,
  type CatalogSort,
  type StockFilter,
} from "@/lib/catalog/types";
import { catalogSearchParams, parseTypesParam } from "@/lib/catalog/url";

function parsePageParam(raw: string | null): number {
  const value = Number(raw ?? 1);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}

function parsePriceParam(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

/**
 * Client URL sync for catalog filters/sort.
 * Resilient: unknown params ignored; replace without scroll jump.
 */
export function useCatalogUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const sort: CatalogSort = isCatalogSort(searchParams.get("sort") ?? undefined)
    ? (searchParams.get("sort") as CatalogSort)
    : "featured";
  const stock: StockFilter = isStockFilter(
    searchParams.get("stock") ?? undefined,
  )
    ? (searchParams.get("stock") as StockFilter)
    : "all";
  const types = useMemo(
    () => parseTypesParam(searchParams.get("types") ?? undefined),
    [searchParams],
  );
  const sale = searchParams.get("sale") === "1";
  const minPrice = parsePriceParam(searchParams.get("min"));
  const maxPrice = parsePriceParam(searchParams.get("max"));
  const page = parsePageParam(searchParams.get("page"));

  const pushState = useCallback(
    (next: {
      sort?: CatalogSort;
      stock?: StockFilter;
      types?: string[];
      sale?: boolean;
      minPrice?: number | null;
      maxPrice?: number | null;
      page?: number;
      q?: string;
    }) => {
      const qs = catalogSearchParams({
        q: "q" in next ? next.q : q,
        sort: next.sort ?? sort,
        stock: next.stock ?? stock,
        types: next.types ?? types,
        sale: next.sale ?? sale,
        minPrice: "minPrice" in next ? next.minPrice : minPrice,
        maxPrice: "maxPrice" in next ? next.maxPrice : maxPrice,
        page: next.page ?? page,
      });
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [maxPrice, minPrice, page, pathname, q, router, sale, sort, stock, types],
  );

  const setQuery = useCallback(
    (nextQuery: string) => pushState({ q: nextQuery.trim().slice(0, 80), page: 1 }),
    [pushState],
  );

  const setSort = useCallback(
    (s: CatalogSort) => pushState({ sort: s, page: 1 }),
    [pushState],
  );

  const setStock = useCallback(
    (s: StockFilter) => pushState({ stock: s, page: 1 }),
    [pushState],
  );

  const toggleType = useCallback(
    (slug: string) => {
      const has = types.includes(slug);
      const next = has ? types.filter((t) => t !== slug) : [...types, slug];
      pushState({ types: next, page: 1 });
    },
    [pushState, types],
  );

  const setSale = useCallback(
    (on: boolean) => pushState({ sale: on, page: 1 }),
    [pushState],
  );

  const setPriceRange = useCallback(
    (min: number | null, max: number | null) =>
      pushState({ minPrice: min, maxPrice: max, page: 1 }),
    [pushState],
  );

  const setPage = useCallback(
    (nextPage: number) => pushState({ page: Math.max(1, Math.floor(nextPage)) }),
    [pushState],
  );

  const clearAll = useCallback(() => {
    // Keep current sort; only drop filter params
    startTransition(() => {
      const qs = catalogSearchParams({
        sort,
        q: "",
        stock: "all",
        types: [],
        sale: false,
        minPrice: null,
        maxPrice: null,
        page: 1,
      });
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }, [pathname, router, sort]);

  // Filters only (sort is separate control — Reset shouldn't clear sort)
  const hasActive =
    stock !== "all" ||
    q.length > 0 ||
    types.length > 0 ||
    sale ||
    minPrice != null ||
    maxPrice != null;

  return {
    q,
    sort,
    stock,
    types,
    sale,
    minPrice,
    maxPrice,
    page,
    pending,
    hasActive,
    setSort,
    setStock,
    toggleType,
    setSale,
    setPriceRange,
    setQuery,
    setPage,
    clearAll,
    pushState,
  };
}
