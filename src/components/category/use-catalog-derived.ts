"use client";

import { useMemo } from "react";
import { filterProducts } from "@/lib/catalog/filter";
import { sortProducts } from "@/lib/catalog/sort";
import type { CatalogPage } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";

/**
 * Derive filtered/sorted shelf from the static category pool + URL state.
 * Pure client work — zero RSC, zero network on filter/sort change.
 */
export function useCatalogDerived(data: CatalogPage) {
  const { sort, stock, types, sale, pending } = useCatalogUrl();

  const products = useMemo(
    () =>
      sortProducts(filterProducts(data.products, { stock, types, sale }), sort),
    [data.products, sale, sort, stock, types],
  );

  return {
    products,
    total: products.length,
    poolTotal: data.poolTotal,
    sort,
    stock,
    types,
    sale,
    pending,
  };
}
