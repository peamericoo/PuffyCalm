"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogFacets } from "@/lib/catalog/types";
import type { Category, Product } from "@/types/product";
import {
  CategoryFilterBody,
  countCatalogFilters,
  emptyCatalogFilterDraft,
  type CatalogFilterDraft,
  useActiveFilterCount,
} from "@/components/category/category-filter-body";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { filterProducts } from "@/lib/catalog/filter";
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
  products?: Product[];
  activeSlug?: string;
  resultCount?: number;
  display?: "mobile" | "all";
  label?: string;
  panelSize?: "sheet" | "desktop";
  triggerVariant?: "pill" | "toolbar";
  className?: string;
}

/**
 * Mobile / tablet filter trigger + premium bottom sheet.
 * Shares CategoryFilterBody with desktop rail.
 */
export function CategoryMobileFilters({
  facets,
  siblings = [],
  products = [],
  activeSlug = "all",
  resultCount,
  display = "mobile",
  label = "Filters",
  panelSize = "sheet",
  triggerVariant = "pill",
  className,
}: CategoryMobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogFilterDraft>(
    emptyCatalogFilterDraft,
  );
  const mounted = useIsClient();
  const {
    stock,
    types,
    sale,
    minPrice,
    maxPrice,
    pushState,
  } = useCatalogUrl();
  const activeCount = useActiveFilterCount();
  const currentDraft = useMemo<CatalogFilterDraft>(
    () => ({
      stock,
      types,
      sale,
      minPrice,
      maxPrice,
    }),
    [maxPrice, minPrice, sale, stock, types],
  );
  const draftActiveCount = countCatalogFilters(draft);
  const hasDraftActive = draftActiveCount > 0;
  const previewCount = useMemo(() => {
    if (products.length === 0) return resultCount;
    return filterProducts(products, draft).length;
  }, [draft, products, resultCount]);

  const openFilters = () => {
    setDraft(currentDraft);
    setOpen(true);
  };

  const clearDraft = () => {
    setDraft(emptyCatalogFilterDraft());
  };

  const applyDraft = () => {
    pushState({ ...draft, page: 1 });
    setOpen(false);
  };

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
              className={cn(
                styles.sheet,
                panelSize === "desktop" && styles.sheetDesktop,
              )}
            >
              <div className={styles.sheetHandle} aria-hidden />
              <div className={styles.sheetHead}>
                <p className={styles.panelTitle}>
                  <SlidersHorizontal
                    className="h-4 w-4 text-brand-deep"
                    strokeWidth={2.25}
                  />
                  Filters
                  {draftActiveCount > 0 ? (
                    <span className={styles.badge}>{draftActiveCount}</span>
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

              <div
                className={cn(
                  styles.sheetBody,
                  panelSize === "desktop" && styles.sheetBodyDesktop,
                )}
              >
                <CategoryFilterBody
                  facets={facets}
                  siblings={siblings}
                  activeSlug={activeSlug}
                  showCollections
                  draft={draft}
                  onDraftChange={setDraft}
                  className={
                    panelSize === "desktop"
                      ? styles.desktopFilterBody
                      : undefined
                  }
                />
              </div>

              <div className={styles.sheetFoot}>
                <button
                  type="button"
                  onClick={clearDraft}
                  disabled={!hasDraftActive}
                  className={styles.sheetBtnGhost}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={applyDraft}
                  className={styles.sheetBtnPrimary}
                >
                  {typeof previewCount === "number"
                    ? `Apply · ${previewCount} ${previewCount === 1 ? "result" : "results"}`
                    : "Apply filters"}
                </button>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className={cn(display === "mobile" && "lg:hidden", className)}>
      <button
        type="button"
        onClick={openFilters}
        className={cn(
          styles.trigger,
          triggerVariant === "toolbar" && styles.triggerToolbar,
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
        {label}
        {activeCount > 0 ? (
          <span className={styles.triggerBadge}>{activeCount}</span>
        ) : null}
      </button>
      {sheet}
    </div>
  );
}
