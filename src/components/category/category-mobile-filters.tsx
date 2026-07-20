"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogFacets } from "@/lib/catalog/types";
import type { Category } from "@/types/product";
import {
  CategoryFilterBody,
  useActiveFilterCount,
} from "@/components/category/category-filter-body";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";
import styles from "./category-filters.module.css";

/** Client-only flag without setState-in-effect (portal needs document). */
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

interface CategoryMobileFiltersProps {
  facets: CatalogFacets;
  siblings?: Category[];
  activeSlug?: string;
  resultCount?: number;
  className?: string;
}

/**
 * Mobile / tablet filter trigger + premium bottom sheet.
 * Shares CategoryFilterBody with desktop rail.
 */
export function CategoryMobileFilters({
  facets,
  siblings = [],
  activeSlug = "all",
  resultCount,
  className,
}: CategoryMobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const { clearAll, hasActive } = useCatalogUrl();
  const activeCount = useActiveFilterCount();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sheet =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="Close filters"
              className={styles.sheetBackdrop}
              onClick={() => setOpen(false)}
            />
            <div
              role="dialog"
              aria-modal
              aria-label="Filters"
              className={styles.sheet}
            >
              <div className={styles.sheetHandle} aria-hidden />
              <div className={styles.sheetHead}>
                <p className={styles.panelTitle}>
                  <SlidersHorizontal
                    className="h-4 w-4 text-brand-deep"
                    strokeWidth={2.25}
                  />
                  Filters
                  {activeCount > 0 ? (
                    <span className={styles.badge}>{activeCount}</span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className={styles.closeIcon}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={styles.sheetBody}>
                <CategoryFilterBody
                  facets={facets}
                  siblings={siblings}
                  activeSlug={activeSlug}
                  showCollections
                />
              </div>

              <div className={styles.sheetFoot}>
                {hasActive ? (
                  <button
                    type="button"
                    onClick={clearAll}
                    className={styles.sheetBtnGhost}
                  >
                    Clear
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={styles.sheetBtnPrimary}
                >
                  {typeof resultCount === "number"
                    ? `Show ${resultCount} ${resultCount === 1 ? "result" : "results"}`
                    : "Show results"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className={cn("lg:hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.trigger}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
        Filters
        {activeCount > 0 ? (
          <span className={styles.triggerBadge}>{activeCount}</span>
        ) : null}
      </button>
      {sheet}
    </div>
  );
}
