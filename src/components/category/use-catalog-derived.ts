"use client";

import { useMemo } from "react";
import { filterProducts } from "@/lib/catalog/filter";
import { sortProducts } from "@/lib/catalog/sort";
import type { CatalogPage } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";

const CATALOG_PAGE_SIZE = 16;

/**
 * Derive filtered/sorted shelf from the static category pool + URL state.
 * Pure client work — zero RSC, zero network on filter/sort change.
 */
export function useCatalogDerived(data: CatalogPage) {
  const { q, sort, stock, types, sale, minPrice, maxPrice, page, pending } =
    useCatalogUrl();

  const sortedProducts = useMemo(
    () =>
      sortProducts(
        filterProducts(data.products, {
          q,
          stock,
          types,
          sale,
          minPrice,
          maxPrice,
        }),
        sort,
      ),
    [data.products, maxPrice, minPrice, q, sale, sort, stock, types],
  );
  const total = sortedProducts.length;
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const products = useMemo(() => {
    const start = (currentPage - 1) * CATALOG_PAGE_SIZE;
    return sortedProducts.slice(start, start + CATALOG_PAGE_SIZE);
  }, [currentPage, sortedProducts]);

  return {
    products,
    total,
    poolTotal: data.poolTotal,
    page: currentPage,
    pageCount,
    pageSize: CATALOG_PAGE_SIZE,
    q,
    sort,
    stock,
    types,
    sale,
    minPrice,
    maxPrice,
    pending,
  };
}
