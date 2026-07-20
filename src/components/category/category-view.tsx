import { ViewTransition } from "react";
import { Suspense } from "react";
import { CategoryEmpty } from "@/components/category/category-empty";
import { CategoryHero } from "@/components/category/category-hero";
import { CategoryNav } from "@/components/category/category-nav";
import { CategoryProductGrid } from "@/components/category/category-product-grid";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import type { CatalogPage } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface CategoryViewProps {
  data: CatalogPage;
  className?: string;
}

/**
 * Full category / collection screen orchestrator.
 * Presentational pieces live in sibling files; data comes from catalog service.
 */
export function CategoryView({ data, className }: CategoryViewProps) {
  const { category, products, siblings, sort, total } = data;

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
        <div className="mx-auto w-full max-w-[1200px] px-[var(--shell-gutter)] pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-7 lg:px-10">
          <CategoryHero category={category} total={total} />

          <CategoryNav
            className="mt-7 sm:mt-9"
            siblings={siblings}
            activeSlug={category.slug}
          />

          {/* useSearchParams requires Suspense boundary in App Router */}
          <Suspense
            fallback={
              <div className="mt-5 h-[3.25rem] border-y border-border/60 sm:mt-6" />
            }
          >
            <CategoryToolbar
              className="mt-5 sm:mt-6"
              total={total}
              sort={sort}
            />
          </Suspense>

          <div className="mt-5 sm:mt-6">
            {products.length === 0 ? (
              <CategoryEmpty categoryName={category.name} />
            ) : (
              <CategoryProductGrid products={products} />
            )}
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
