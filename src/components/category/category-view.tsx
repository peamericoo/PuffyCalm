"use client";

import { Suspense, useEffect, useMemo } from "react";
import { ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { CategoryActiveChips } from "@/components/category/category-active-chips";
import { CategoryEmpty } from "@/components/category/category-empty";
import { CategoryFilters } from "@/components/category/category-filters";
import { CategoryHeader } from "@/components/category/category-header";
import { CategoryMobileFilters } from "@/components/category/category-mobile-filters";
import { CategoryProductGrid } from "@/components/category/category-product-grid";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import { useCatalogDerived } from "@/components/category/use-catalog-derived";
import type { CatalogPage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface CategoryViewProps {
  data: CatalogPage;
  className?: string;
}

function FiltersFallback() {
  return (
    <div
      className="hidden lg:block"
      style={{ viewTransitionName: "catalog-filters" }}
      aria-hidden
    >
      <div className="h-[22rem] rounded-[1.5rem] bg-white/45" />
    </div>
  );
}

/**
 * Premium catalog — aligned grid shell, client filter/sort, light native VT.
 * Product cards unchanged. No full-page morph (avoids glass snapshot freezes).
 */
export function CategoryView({ data, className }: CategoryViewProps) {
  const { category, siblings, facets } = data;
  const { products, total, poolTotal, pending, sort, stock, types, sale } =
    useCatalogDerived(data);
  const router = useRouter();

  // Warm sibling routes so category switches stay instant
  useEffect(() => {
    for (const s of siblings) {
      router.prefetch(`/category/${s.slug}`);
    }
  }, [router, siblings]);

  const shelfKey = useMemo(
    () =>
      `${category.slug}:${sort}:${stock}:${types.join(",")}:${sale ? 1 : 0}`,
    [category.slug, sale, sort, stock, types],
  );

  return (
    <div className={cn("shop-stage relative min-h-[70vh]", className)}>
      {/* Cheap ambient — no blur-3xl (paint thrash during nav) */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgb(255_255_255/0.55),transparent_70%)]"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-[var(--shell-gutter)] pb-16 pt-4 sm:px-5 sm:pb-20 sm:pt-5 lg:px-6">
        <ViewTransition
          update={{ catalog: "catalog-header", default: "none" }}
          default="none"
        >
          <CategoryHeader category={category} total={poolTotal} />
        </ViewTransition>

        <div
          className={cn(
            "mt-6 grid grid-cols-1 gap-5 sm:mt-7 sm:gap-6",
            "lg:mt-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-7",
            "xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-8",
          )}
        >
          {/* Filters — stable named VT group (no morph thrash) */}
          <Suspense fallback={<FiltersFallback />}>
            <ViewTransition name="catalog-filters" default="none">
              <CategoryFilters
                facets={facets}
                siblings={siblings}
                activeSlug={category.slug}
              />
            </ViewTransition>
          </Suspense>

          <div className="min-w-0">
            <Suspense
              fallback={
                <div className="mb-4 h-10 w-full rounded-full bg-white/40" />
              }
            >
              <div className="mb-3.5 flex flex-col gap-2.5 sm:mb-4">
                <CategoryToolbar
                  total={total}
                  poolTotal={poolTotal}
                  trailing={
                    <CategoryMobileFilters
                      facets={facets}
                      siblings={siblings}
                      activeSlug={category.slug}
                      resultCount={total}
                    />
                  }
                />
                <CategoryActiveChips facets={facets} />
              </div>
            </Suspense>

            {/* Shelf only crossfades — GPU opacity/transform, not whole page */}
            <ViewTransition update="catalog-shelf" default="none">
              <div
                key={shelfKey}
                className={cn(
                  "catalog-shelf",
                  pending && "opacity-80 transition-opacity duration-150",
                )}
              >
                {products.length === 0 ? (
                  <CategoryEmpty categoryName={category.name} />
                ) : (
                  <CategoryProductGrid products={products} />
                )}
              </div>
            </ViewTransition>
          </div>
        </div>
      </div>
    </div>
  );
}
