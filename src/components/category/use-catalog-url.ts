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

/**
 * Client URL sync for catalog filters/sort.
 * Resilient: unknown params ignored; replace without scroll jump.
 */
export function useCatalogUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

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

  const pushState = useCallback(
    (next: {
      sort?: CatalogSort;
      stock?: StockFilter;
      types?: string[];
      sale?: boolean;
    }) => {
      const qs = catalogSearchParams({
        sort: next.sort ?? sort,
        stock: next.stock ?? stock,
        types: next.types ?? types,
        sale: next.sale ?? sale,
      });
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, sale, sort, stock, types],
  );

  const setSort = useCallback(
    (s: CatalogSort) => pushState({ sort: s }),
    [pushState],
  );

  const setStock = useCallback(
    (s: StockFilter) => pushState({ stock: s }),
    [pushState],
  );

  const toggleType = useCallback(
    (slug: string) => {
      const has = types.includes(slug);
      const next = has ? types.filter((t) => t !== slug) : [...types, slug];
      pushState({ types: next });
    },
    [pushState, types],
  );

  const setSale = useCallback(
    (on: boolean) => pushState({ sale: on }),
    [pushState],
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const hasActive =
    sort !== "featured" || stock !== "all" || types.length > 0 || sale;

  return {
    sort,
    stock,
    types,
    sale,
    pending,
    hasActive,
    setSort,
    setStock,
    toggleType,
    setSale,
    clearAll,
    pushState,
  };
}
