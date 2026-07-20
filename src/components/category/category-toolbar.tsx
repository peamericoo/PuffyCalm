"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  CATALOG_SORT_OPTIONS,
  type CatalogSort,
} from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

interface CategoryToolbarProps {
  total: number;
  sort: CatalogSort;
  className?: string;
}

/**
 * Result count + sort control.
 * Sort lives in URL (`?sort=`) so it survives refresh and is API-ready.
 */
export function CategoryToolbar({
  total,
  sort,
  className,
}: CategoryToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const onSort = useCallback(
    (next: CatalogSort) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "featured") params.delete("sort");
      else params.set("sort", next);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-3 sm:py-3.5",
        pending && "opacity-70",
        className,
      )}
    >
      <p className="text-[12.5px] text-muted-foreground sm:text-[13px]">
        Showing{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {total}
        </span>{" "}
        {total === 1 ? "item" : "items"}
      </p>

      <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <span className="hidden font-medium sm:inline">Sort</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as CatalogSort)}
          disabled={pending}
          className={cn(
            "h-9 border border-border/80 bg-white px-2.5 text-[12.5px] font-medium text-foreground",
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
