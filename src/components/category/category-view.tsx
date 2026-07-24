"use client";

import { Suspense, useMemo } from "react";
import { ViewTransition } from "react";
import {
  CategoryDesktopControls,
  CategoryDesktopHero,
  CategoryMobileControls,
} from "@/components/category/category-desktop-showcase";
import { CategoryEmpty } from "@/components/category/category-empty";
import { CategoryPagination } from "@/components/category/category-pagination";
import { CategoryProductGrid } from "@/components/category/category-product-grid";
import { useCatalogDerived } from "@/components/category/use-catalog-derived";
import type { CatalogPage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface CategoryViewProps {
  data: CatalogPage;
  className?: string;
}

/**
 * Premium catalog — aligned grid shell, client filter/sort, light native VT.
 * Mobile keeps the existing stack; desktop uses editorial hero + horizontal controls.
 */
export function CategoryView({ data, className }: CategoryViewProps) {
  const { category, siblings, facets } = data;
  const {
    products,
    total,
    poolTotal,
    page,
    pageCount,
    pageSize,
    pending,
    q,
    sort,
    stock,
    types,
    sale,
    minPrice,
    maxPrice,
  } =
    useCatalogDerived(data);

  const shelfKey = useMemo(
    () =>
      `${category.slug}:${q}:${sort}:${stock}:${types.join(",")}:${sale ? 1 : 0}:${minPrice ?? ""}:${maxPrice ?? ""}:${page}`,
    [category.slug, maxPrice, minPrice, page, q, sale, sort, stock, types],
  );

  return (
    <div className={cn("shop-stage relative min-h-[70vh]", className)}>
      <div className="relative mx-auto w-full max-w-[1500px] px-[var(--shell-gutter)] pb-16 pt-4 sm:px-5 sm:pb-20 sm:pt-5 lg:px-6 lg:pt-7">
        {/*
          Named title pair — same view-transition-name on every category route
          so old/new titles crossfade instead of hard-cutting.
        */}
        <ViewTransition
          name="catalog-title"
          share="catalog-header"
          enter={{
            catalog: "catalog-header",
            default: "catalog-header",
          }}
          exit={{
            catalog: "catalog-header",
            default: "catalog-header",
          }}
          update="catalog-header"
          default="none"
        >
          <div key={category.slug} className="catalog-title-block">
            <CategoryDesktopHero
              category={category}
              siblings={siblings}
              products={data.products}
              total={poolTotal}
            />
          </div>
        </ViewTransition>

        <div className="mt-6 sm:mt-7 lg:mt-7">
          <div className="min-w-0">
            <Suspense
              fallback={
                <div className="mb-4 h-10 w-full rounded-full bg-white/40" />
              }
            >
              <CategoryMobileControls
                category={category}
                siblings={siblings}
                facets={facets}
                products={data.products}
                total={total}
                pending={pending}
                className="mb-4 lg:hidden"
              />
              <CategoryDesktopControls
                category={category}
                siblings={siblings}
                facets={facets}
                products={data.products}
                total={total}
                poolTotal={poolTotal}
                pending={pending}
                className="mb-5 hidden lg:block"
              />
            </Suspense>

            <div
              key={shelfKey}
              className={cn(
                "catalog-shelf",
                pending && "opacity-80 transition-opacity duration-150",
              )}
            >
              <div
                id="catalog-results"
                className="scroll-mt-[calc(var(--promo-h)+var(--nav-h)+1.25rem)]"
              />
              {total === 0 ? (
                <CategoryEmpty categoryName={category.name} />
              ) : (
                <>
                  <CategoryProductGrid
                    products={products}
                    variant="editorial"
                  />
                  <CategoryPagination
                    page={page}
                    pageCount={pageCount}
                    total={total}
                    pageSize={pageSize}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
