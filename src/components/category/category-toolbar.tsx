"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CATALOG_SORT_OPTIONS } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

interface CategoryToolbarProps {
  total: number;
  poolTotal: number;
  className?: string;
  /** Slot for mobile filter trigger */
  trailing?: ReactNode;
}

/**
 * Results count + sort — glass control bar.
 */
export function CategoryToolbar({
  total,
  poolTotal,
  className,
  trailing,
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
      <p className="text-[13px] tabular-nums text-muted-foreground sm:text-[13.5px]">
        <span className="font-semibold text-foreground">{total}</span>
        {poolTotal > total ? (
          <>
            {" "}
            of{" "}
            <span className="font-semibold text-foreground">{poolTotal}</span>
          </>
        ) : null}{" "}
        {total === 1 ? "result" : "results"}
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        {trailing}

        <label className="relative inline-flex items-center">
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            onChange={(e) =>
              setSort(
                e.target.value as (typeof CATALOG_SORT_OPTIONS)[number]["value"],
              )
            }
            disabled={pending}
            className={cn(
              "h-10 appearance-none rounded-full pl-3.5 pr-9 text-[12.5px] font-semibold text-foreground",
              "bg-white/70 backdrop-blur-md",
              "border border-white/70 shadow-[0_1px_0_rgb(255_255_255/0.85)_inset,0_8px_20px_-12px_rgb(26_35_50/0.2)]",
              "outline-none transition focus:border-brand-deep/40",
              "disabled:opacity-50",
              "cursor-pointer",
            )}
            aria-label="Sort products"
          >
            {CATALOG_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2.25}
            aria-hidden
          />
        </label>
      </div>
    </div>
  );
}
