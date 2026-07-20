"use client";

import { CATALOG_SORT_OPTIONS } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

interface CategoryToolbarProps {
  total: number;
  poolTotal: number;
  className?: string;
}

/**
 * Results count + sort — Estore results bar.
 */
export function CategoryToolbar({
  total,
  poolTotal,
  className,
}: CategoryToolbarProps) {
  const { sort, setSort, pending } = useCatalogUrl();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        pending && "opacity-70",
        className,
      )}
    >
      <p className="text-[12.5px] tabular-nums text-muted-foreground sm:text-[13px]">
        <span className="font-semibold text-foreground">{total}</span>
        {poolTotal > total ? (
          <>
            {" "}
            of{" "}
            <span className="font-semibold text-foreground">{poolTotal}</span>
          </>
        ) : null}{" "}
        results
      </p>

      <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="font-medium">Sort by</span>
        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as (typeof CATALOG_SORT_OPTIONS)[number]["value"])
          }
          disabled={pending}
          className={cn(
            "h-9 min-w-[8.5rem] border border-border/80 bg-white px-2.5 text-[12.5px] font-medium text-foreground",
            "outline-none transition focus:border-brand-deep/40",
            "disabled:opacity-50",
          )}
          aria-label="Sort products"
        >
          {CATALOG_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
