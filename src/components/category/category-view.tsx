import { ViewTransition } from "react";
import { Suspense } from "react";
import { CategoryActiveChips } from "@/components/category/category-active-chips";
import { CategoryEmpty } from "@/components/category/category-empty";
import { CategoryFilters } from "@/components/category/category-filters";
import { CategoryHeader } from "@/components/category/category-header";
import { CategoryMobileFilters } from "@/components/category/category-mobile-filters";
import { CategoryProductGrid } from "@/components/category/category-product-grid";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import type { CatalogPage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface CategoryViewProps {
  data: CatalogPage;
  className?: string;
}

function FiltersFallback() {
  return (
    <div className="hidden w-[17.5rem] shrink-0 lg:block xl:w-[18.5rem]">
      <div className="glass-panel h-[28rem] animate-pulse rounded-[1.5rem]" />
    </div>
  );
}

/**
 * Premium catalog layout (Sky Calm):
 * shop-stage stage → compact header → glass filter panel + product shelf.
 * Product cards stay as-is; everything else is conversion-forward.
 */
export function CategoryView({ data, className }: CategoryViewProps) {
  const { category, products, siblings, total, poolTotal, facets } = data;

  return (
    <ViewTransition
      enter={{
        "nav-forward": "pdp-shell",
        "nav-back": "pdp-shell",
        default: "pdp-shell",
      }}
      default="none"
    >
      <div className={cn("shop-stage relative min-h-[70vh]", className)}>
        {/* Soft ambient blobs — figure-ground for white cards */}
        <span
          className="pointer-events-none absolute -left-20 top-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-16 top-10 h-56 w-56 rounded-full bg-white/50 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute bottom-20 left-1/3 h-48 w-48 rounded-full bg-cta/8 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[1400px] px-[var(--shell-gutter)] pb-16 pt-4 sm:px-5 sm:pb-20 sm:pt-6 lg:px-6">
          <CategoryHeader category={category} total={poolTotal} />

          <div className="mt-7 flex flex-col gap-5 sm:mt-9 lg:mt-10 lg:flex-row lg:items-start lg:gap-7 xl:gap-8">
            <Suspense fallback={<FiltersFallback />}>
              <CategoryFilters
                facets={facets}
                siblings={siblings}
                activeSlug={category.slug}
              />
            </Suspense>

            <div className="min-w-0 flex-1">
              <Suspense
                fallback={
                  <div className="mb-4 h-10 w-full rounded-full bg-white/40" />
                }
              >
                <CategoryToolbar
                  total={total}
                  poolTotal={poolTotal}
                  className="mb-3.5"
                  trailing={
                    <CategoryMobileFilters
                      facets={facets}
                      siblings={siblings}
                      activeSlug={category.slug}
                      resultCount={total}
                    />
                  }
                />
                <CategoryActiveChips facets={facets} className="mb-4" />
              </Suspense>

              {products.length === 0 ? (
                <CategoryEmpty categoryName={category.name} />
              ) : (
                <CategoryProductGrid products={products} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
