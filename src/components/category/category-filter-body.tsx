"use client";

import type { CSSProperties, Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import type { CatalogFacets, StockFilter } from "@/lib/catalog/types";
import type { Category } from "@/types/product";
import { CatalogLink } from "@/components/category/catalog-link";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { categoryDisplayImage } from "@/lib/catalog/category-image";
import { cn } from "@/lib/utils";
import styles from "./category-filters.module.css";

export interface CategoryFilterBodyProps {
  facets: CatalogFacets;
  /** Mood / collection nav (siblings from catalog) */
  siblings?: Category[];
  activeSlug?: string;
  /** Hide collection nav (e.g. already in a nested context) */
  showCollections?: boolean;
  /** Optional draft mode: update local state instead of the catalog URL. */
  draft?: CatalogFilterDraft;
  onDraftChange?: Dispatch<SetStateAction<CatalogFilterDraft>>;
  className?: string;
}

export type CatalogFilterDraft = {
  stock: StockFilter;
  types: string[];
  sale: boolean;
  minPrice: number | null;
  maxPrice: number | null;
};

export function emptyCatalogFilterDraft(): CatalogFilterDraft {
  return {
    stock: "all",
    types: [],
    sale: false,
    minPrice: null,
    maxPrice: null,
  };
}

export function countCatalogFilters(draft: CatalogFilterDraft) {
  return (
    (draft.stock !== "all" ? 1 : 0) +
    draft.types.length +
    (draft.sale ? 1 : 0) +
    (draft.minPrice != null || draft.maxPrice != null ? 1 : 0)
  );
}

function priceChipLabel(draft: CatalogFilterDraft) {
  if (draft.minPrice != null && draft.maxPrice != null) {
    return `$${draft.minPrice}–$${draft.maxPrice}`;
  }
  if (draft.minPrice != null) return `From $${draft.minPrice}`;
  if (draft.maxPrice != null) return `Up to $${draft.maxPrice}`;
  return "Any price";
}

function clampPrice(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function cleanPriceRange(
  minValue: number,
  maxValue: number,
  minBound: number,
  maxBound: number,
) {
  return {
    minPrice: minValue <= minBound ? null : minValue,
    maxPrice: maxValue >= maxBound ? null : maxValue,
  };
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

function PriceRangeFilter({
  bounds,
  minPrice,
  maxPrice,
  onChange,
}: {
  bounds: { min: number; max: number };
  minPrice: number | null;
  maxPrice: number | null;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const minBound = Math.max(0, Math.floor(bounds.min || 0));
  const maxBound = Math.max(minBound, Math.ceil(bounds.max || 0));

  if (maxBound <= minBound) return null;

  const currentMin = clampPrice(minPrice ?? minBound, minBound, maxBound);
  const currentMax = clampPrice(maxPrice ?? maxBound, minBound, maxBound);
  const safeMin = Math.min(currentMin, currentMax);
  const safeMax = Math.max(currentMin, currentMax);
  const span = Math.max(1, maxBound - minBound);
  const left = ((safeMin - minBound) / span) * 100;
  const right = 100 - ((safeMax - minBound) / span) * 100;
  const hasCustom = minPrice != null || maxPrice != null;

  const commit = (nextMin: number, nextMax: number) => {
    const clean = cleanPriceRange(nextMin, nextMax, minBound, maxBound);
    onChange(clean.minPrice, clean.maxPrice);
  };

  const setMin = (value: number) => {
    const next = clampPrice(value, minBound, safeMax);
    commit(next, safeMax);
  };

  const setMax = (value: number) => {
    const next = clampPrice(value, safeMin, maxBound);
    commit(safeMin, next);
  };

  return (
    <section className={cn(styles.section, styles.priceSection)}>
      <div className={styles.priceHead}>
        <div>
          <p className={styles.sectionLabel}>Price range</p>
          <p className={styles.priceSummary}>
            {priceChipLabel({ stock: "all", types: [], sale: false, minPrice, maxPrice })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null, null)}
          disabled={!hasCustom}
          className={styles.priceReset}
        >
          Reset
        </button>
      </div>

      <div className={styles.priceInputs}>
        <label className={styles.priceInputWrap}>
          <span>Min</span>
          <input
            type="number"
            min={minBound}
            max={safeMax}
            value={minPrice ?? ""}
            placeholder={`$${minBound}`}
            onChange={(event) => {
              const raw = event.currentTarget.value;
              if (raw === "") {
                onChange(null, maxPrice);
                return;
              }
              setMin(Number(raw));
            }}
          />
        </label>
        <label className={styles.priceInputWrap}>
          <span>Max</span>
          <input
            type="number"
            min={safeMin}
            max={maxBound}
            value={maxPrice ?? ""}
            placeholder={`$${maxBound}`}
            onChange={(event) => {
              const raw = event.currentTarget.value;
              if (raw === "") {
                onChange(minPrice, null);
                return;
              }
              setMax(Number(raw));
            }}
          />
        </label>
      </div>

      <div
        className={styles.rangeWrap}
        style={
          {
            "--range-left": `${left}%`,
            "--range-right": `${right}%`,
          } as CSSProperties
        }
      >
        <div className={styles.rangeTrack} aria-hidden />
        <input
          aria-label="Minimum price"
          type="range"
          min={minBound}
          max={maxBound}
          value={safeMin}
          onChange={(event) => setMin(Number(event.currentTarget.value))}
          className={styles.rangeInput}
        />
        <input
          aria-label="Maximum price"
          type="range"
          min={minBound}
          max={maxBound}
          value={safeMax}
          onChange={(event) => setMax(Number(event.currentTarget.value))}
          className={styles.rangeInput}
        />
      </div>

      <div className={styles.priceTicks} aria-hidden>
        <span>${minBound}</span>
        <span>${maxBound}</span>
      </div>
    </section>
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
  draft,
  onDraftChange,
  className,
}: CategoryFilterBodyProps) {
  const {
    stock,
    types,
    sale,
    minPrice,
    maxPrice,
    setStock,
    toggleType,
    setSale,
    setPriceRange,
    clearAll,
    pending,
  } = useCatalogUrl();

  const isDraftMode = Boolean(draft && onDraftChange);
  const current: CatalogFilterDraft = draft ?? {
    stock,
    types,
    sale,
    minPrice,
    maxPrice,
  };

  const setCurrentStock = (next: StockFilter) => {
    if (draft && onDraftChange) {
      onDraftChange((prev) => ({ ...prev, stock: next }));
      return;
    }
    setStock(next);
  };

  const toggleCurrentType = (slug: string) => {
    if (draft && onDraftChange) {
      onDraftChange((prev) => {
        const has = prev.types.includes(slug);
        return {
          ...prev,
          types: has
            ? prev.types.filter((item) => item !== slug)
            : [...prev.types, slug],
        };
      });
      return;
    }
    toggleType(slug);
  };

  const setCurrentSale = (next: boolean) => {
    if (draft && onDraftChange) {
      onDraftChange((prev) => ({ ...prev, sale: next }));
      return;
    }
    setSale(next);
  };

  const setCurrentPriceRange = (min: number | null, max: number | null) => {
    if (draft && onDraftChange) {
      onDraftChange((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
      return;
    }
    setPriceRange(min, max);
  };

  const clearCurrent = () => {
    if (draft && onDraftChange) {
      onDraftChange(emptyCatalogFilterDraft());
      return;
    }
    clearAll();
  };

  const setStockExclusive = (value: Exclude<StockFilter, "all">) => {
    if (current.stock === value) setCurrentStock("all");
    else setCurrentStock(value);
  };

  const collections = [
    ...siblings.filter((c) => c.slug !== "all"),
    ...siblings.filter((c) => c.slug === "all"),
  ];

  const activeFilterCount = countCatalogFilters(current);
  const hasActive = activeFilterCount > 0;

  return (
    <div className={cn(!isDraftMode && pending && styles.pending, className)}>
      {/* Active chips */}
      {hasActive && activeFilterCount > 0 ? (
        <div className={styles.chipRow}>
          {current.stock === "in" ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setCurrentStock("all")}
            >
              In stock
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {current.stock === "out" ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setCurrentStock("all")}
            >
              Out of stock
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {current.types.map((slug) => {
            const meta = facets.types.find((t) => t.slug === slug);
            return (
              <button
                key={slug}
                type="button"
                className={styles.chip}
                onClick={() => toggleCurrentType(slug)}
              >
                {meta?.name ?? slug}
                <span aria-hidden>×</span>
              </button>
            );
          })}
          {current.sale ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setCurrentSale(false)}
            >
              On sale
              <span aria-hidden>×</span>
            </button>
          ) : null}
          {current.minPrice != null || current.maxPrice != null ? (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setCurrentPriceRange(null, null)}
            >
              {priceChipLabel(current)}
              <span aria-hidden>×</span>
            </button>
          ) : null}
          <button type="button" className={styles.clearBtn} onClick={clearCurrent}>
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
                    {categoryDisplayImage(c.imageUrl) ? (
                      <Image
                        src={categoryDisplayImage(c.imageUrl)!}
                        alt=""
                        fill
                        sizes="48px"
                        className={styles.moodThumbImg}
                      />
                    ) : (
                      <span
                        className="absolute inset-0 brand-gradient opacity-90"
                        aria-hidden
                      />
                    )}
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
            checked={current.stock === "in"}
            onChange={() => setStockExclusive("in")}
            disabled={facets.stock.in === 0}
          />
          <FilterCheck
            label="Out of stock"
            count={facets.stock.out}
            checked={current.stock === "out"}
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
                checked={current.types.includes(t.slug)}
                onChange={() => toggleCurrentType(t.slug)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <PriceRangeFilter
        bounds={facets.price}
        minPrice={current.minPrice}
        maxPrice={current.maxPrice}
        onChange={setCurrentPriceRange}
      />

      {/* Offers */}
      <section className={styles.section}>
        <p className={styles.sectionLabel}>Offers</p>
        <div className={styles.checkList}>
          <FilterCheck
            label="On sale"
            count={facets.sale}
            checked={current.sale}
            onChange={() => setCurrentSale(!current.sale)}
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
  const { stock, types, sale, minPrice, maxPrice } = useCatalogUrl();
  return countCatalogFilters({ stock, types, sale, minPrice, maxPrice });
}
