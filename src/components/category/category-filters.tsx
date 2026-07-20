"use client";

import type { ReactNode } from "react";
import type { CatalogFacets, StockFilter } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

interface CategoryFiltersProps {
  facets: CatalogFacets;
  className?: string;
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-border/60 py-4 first:pt-0 last:border-b-0">
      <p className="mb-3 text-[12px] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 text-[13px] text-foreground/90",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-3.5 w-3.5 shrink-0 rounded-sm border-border accent-foreground"
      />
      <span className="flex-1 leading-snug">{label}</span>
      {typeof count === "number" ? (
        <span className="tabular-nums text-[11.5px] text-muted-foreground">
          {count}
        </span>
      ) : null}
    </label>
  );
}

/**
 * Desktop left rail — Estore-style filter groups.
 * State is URL-driven via useCatalogUrl.
 */
export function CategoryFilters({ facets, className }: CategoryFiltersProps) {
  const { stock, types, sale, setStock, toggleType, setSale, pending } =
    useCatalogUrl();

  const setStockExclusive = (value: Exclude<StockFilter, "all">) => {
    // Toggle behavior: clicking active clears to all
    if (stock === value) setStock("all");
    else setStock(value);
  };

  return (
    <aside
      className={cn(
        "hidden w-[14.5rem] shrink-0 lg:block xl:w-[15.5rem]",
        pending && "opacity-70",
        className,
      )}
      aria-label="Filters"
    >
      <FilterSection title="Availability">
        <CheckRow
          label="In stock"
          count={facets.stock.in}
          checked={stock === "in"}
          onChange={() => setStockExclusive("in")}
          disabled={facets.stock.in === 0}
        />
        <CheckRow
          label="Out of stock"
          count={facets.stock.out}
          checked={stock === "out"}
          onChange={() => setStockExclusive("out")}
          disabled={facets.stock.out === 0}
        />
      </FilterSection>

      {facets.types.length > 0 ? (
        <FilterSection title="Collection">
          {facets.types.map((t) => (
            <CheckRow
              key={t.slug}
              label={t.name}
              count={t.count}
              checked={types.includes(t.slug)}
              onChange={() => toggleType(t.slug)}
            />
          ))}
        </FilterSection>
      ) : null}

      <FilterSection title="Offers">
        <CheckRow
          label="On sale"
          count={facets.sale}
          checked={sale}
          onChange={() => setSale(!sale)}
          disabled={facets.sale === 0}
        />
      </FilterSection>
    </aside>
  );
}
