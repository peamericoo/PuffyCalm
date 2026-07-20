"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { CatalogFacets, StockFilter } from "@/lib/catalog/types";
import type { Category } from "@/types/product";
import { CatalogLink } from "@/components/category/catalog-link";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";
import styles from "./category-filters.module.css";

export interface CategoryFilterBodyProps {
  facets: CatalogFacets;
  /** Mood / collection nav (siblings from catalog) */
  siblings?: Category[];
  activeSlug?: string;
  /** Hide collection nav (e.g. already in a nested context) */
  showCollections?: boolean;
  className?: string;
}

function FilterCheck({
  label,
  count,
  checked,
  onChange,
  disabled,
  sale,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  sale?: boolean;
}) {
  return (
    <label
      className={cn(
        styles.checkRow,
        sale && styles.saleRow,
        disabled && styles.checkRowDisabled,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={styles.checkInput}
      />
      <span className={styles.checkBox} aria-hidden>
        <Check className={cn(styles.checkMark, "h-3 w-3")} strokeWidth={3} />
      </span>
      <span className={styles.checkLabel}>
        {label}
        {sale ? <span className={styles.saleTag}>Deal</span> : null}
      </span>
      {typeof count === "number" ? (
        <span className={styles.checkCount}>{count}</span>
      ) : null}
    </label>
  );
}

/**
 * Shared filter controls — desktop panel body + mobile sheet.
 * Fully URL-driven via useCatalogUrl.
 */
export function CategoryFilterBody({
  facets,
  siblings = [],
  activeSlug = "all",
  showCollections = true,
  className,
}: CategoryFilterBodyProps) {
  const {
    stock,
    types,
    sale,
    setStock,
    toggleType,
    setSale,
    clearAll,
    hasActive,
    pending,
  } = useCatalogUrl();

  const setStockExclusive = (value: Exclude<StockFilter, "all">) => {
    if (stock === value) setStock("all");
    else setStock(value);
  };

  const collections = [
    ...siblings.filter((c) => c.slug !== "all"),
    ...siblings.filter((c) => c.slug === "all"),
  ];

  const activeFilterCount =
    (stock !== "all" ? 1 : 0) + types.length + (sale ? 1 : 0);

  return (
    <div className={cn(pending && styles.pending, className)}>
      {/* Active chips */}
      {hasActive && activeFilterCount > 0 ? (
        <div className={styles.chipRow}>
          {stock === "in" ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setStock("all")}
            >
              In stock
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {stock === "out" ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setStock("all")}
            >
              Out of stock
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {types.map((slug) => {
            const meta = facets.types.find((t) => t.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                className={styles.chip}
                onClick={() => toggleType(slug)}
              >
                {meta?.name ?? slug}
                <span aria-hidden>×</span>
              </button>
            );
          })}
          {sale ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setSale(false)}
            >
              On sale
              <span aria-hidden>×</span>
            </button>
          ) : null}
          <button type="button" className={styles.clearBtn} onClick={clearAll}>
            Clear all
          </button>
        </div>
      ) : null}

      {/* Collections — visual mood nav */}
      {showCollections && collections.length > 0 ? (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Collections</p>
          <nav className={styles.moodList} aria-label="Collections">
            {collections.map((c) => {
              const active = c.slug === activeSlug;
              return (
                <CatalogLink
                  key={c.id}
                  slug={c.slug}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    styles.moodItem,
                    active && styles.moodItemActive,
                  )}
                >
                  <span className={styles.moodThumb}>
                    <Image
                      src={c.imageUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className={styles.moodThumbImg}
                    />
                    <span className={styles.moodThumbOverlay} />
                  </span>
                  <span className={styles.moodMeta}>
                    <span className={styles.moodName}>{c.name}</span>
                    <span className={styles.moodCount}>
                      {c.productCount}{" "}
                      {c.productCount === 1 ? "piece" : "pieces"}
                    </span>
                  </span>
                  {active ? <span className={styles.moodDot} /> : null}
                </CatalogLink>
              );
            })}
          </nav>
        </section>
      ) : null}

      {/* Availability */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Availability</p>
        <div className={styles.checkList}>
          <FilterCheck
            label="In stock"
            count={facets.stock.in}
            checked={stock === "in"}
            onChange={() => setStockExclusive("in")}
            disabled={facets.stock.in === 0}
          />
          <FilterCheck
            label="Out of stock"
            count={facets.stock.out}
            checked={stock === "out"}
            onChange={() => setStockExclusive("out")}
            disabled={facets.stock.out === 0}
          />
        </div>
      </section>

      {/* Type refine (when browsing all) */}
      {facets.types.length > 0 ? (
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Refine</p>
          <div className={styles.checkList}>
            {facets.types.map((t) => (
              <FilterCheck
                key={t.slug}
                label={t.name}
                count={t.count}
                checked={types.includes(t.slug)}
                onChange={() => toggleType(t.slug)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Offers */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Offers</p>
        <div className={styles.checkList}>
          <FilterCheck
            label="On sale"
            count={facets.sale}
            checked={sale}
            onChange={() => setSale(!sale)}
            disabled={facets.sale === 0}
            sale
          />
        </div>
      </section>
    </div>
  );
}

/** Active filter count for badges (stock + types + sale). */
export function useActiveFilterCount() {
  const { stock, types, sale } = useCatalogUrl();
  return (stock !== "all" ? 1 : 0) + types.length + (sale ? 1 : 0);
}
