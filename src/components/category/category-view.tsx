import { ViewTransition } from "react";
import { Suspense } from "react";
import { CategoryActiveChips } from "@/components/category/category-active-chips";
import { CategoryEmpty } from "@/components/category/category-empty";
import { CategoryFilters } from "@/components/category/category-filters";
import { CategoryHeader } from "@/components/category/category-header";
import { CategoryMobileFilters } from "@/components/category/category-mobile-filters";
import { CategoryMoodRail } from "@/components/category/category-mood-rail";
import { CategoryProductGrid } from "@/components/category/category-product-grid";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import type { CatalogPage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface CategoryViewProps {
  data: CatalogPage;
  className?: string;
}

function FiltersFallback() {
  return <div className="hidden w-[14.5rem] shrink-0 lg:block xl:w-[15.5rem]" />;
}

/**
 * Estore-inspired collection layout:
 * slim title → mood image rail → sidebar filters + product shelf.
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
      <div className={cn("bg-white", className)}>
        <div className="mx-auto w-full max-w-[1200px] px-[var(--shell-gutter)] pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-6 lg:px-10">
          <CategoryHeader category={category} />

          <CategoryMoodRail
            className="mt-6 sm:mt-8"
            siblings={siblings}
            activeSlug={category.slug}
          />

          <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-5">
            <Suspense
              fallback={
                <div className="h-9 w-full border-b border-border/40" />
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CategoryToolbar total={total} poolTotal={poolTotal} />
                <CategoryMobileFilters facets={facets} />
              </div>
              <CategoryActiveChips facets={facets} />
            </Suspense>
          </div>

          <div className="mt-6 flex items-start gap-8 lg:gap-10 xl:gap-12">
            <Suspense fallback={<FiltersFallback />}>
              <CategoryFilters facets={facets} />
            </Suspense>

            <div className="min-w-0 flex-1">
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
