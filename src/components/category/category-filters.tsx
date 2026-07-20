"use client";

import { SlidersHorizontal } from "lucide-react";
import type { CatalogFacets } from "@/lib/catalog/types";
import type { Category } from "@/types/product";
import {
  CategoryFilterBody,
  useActiveFilterCount,
} from "@/components/category/category-filter-body";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";
import styles from "./category-filters.module.css";

interface CategoryFiltersProps {
  facets: CatalogFacets;
  siblings?: Category[];
  activeSlug?: string;
  className?: string;
}

/**
 * Desktop sticky glass filter panel — fully encapsulated.
 */
export function CategoryFilters({
  facets,
  siblings = [],
  activeSlug = "all",
  className,
}: CategoryFiltersProps) {
  const { clearAll, hasActive, pending } = useCatalogUrl();
  const activeCount = useActiveFilterCount();

  return (
    <aside
      className={cn(
        "hidden w-[17.5rem] shrink-0 lg:block xl:w-[18.5rem]",
        "lg:sticky lg:top-[calc(var(--promo-h)+5.25rem)] lg:self-start",
        className,
      )}
      aria-label="Filters"
    >
      <div className={cn(styles.panel, pending && styles.pending)}>
        <span className={styles.panelGlowA} aria-hidden />
        <span className={styles.panelGlowB} aria-hidden />

        <div className={styles.panelInner}>
          <div className={styles.panelHead}>
            <p className={styles.panelTitle}>
              <SlidersHorizontal className="h-4 w-4 text-brand-deep" strokeWidth={2.25} />
              Filters
              {activeCount > 0 ? (
                <span className={styles.badge}>{activeCount}</span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={clearAll}
              disabled={!hasActive}
              className={styles.clearBtn}
            >
              Reset
            </button>
          </div>

          <CategoryFilterBody
            facets={facets}
            siblings={siblings}
            activeSlug={activeSlug}
            showCollections
          />
        </div>
      </div>
    </aside>
  );
}
