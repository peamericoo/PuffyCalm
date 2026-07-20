"use client";

import type { ReactNode } from "react";
import { CategorySortDropdown } from "@/components/category/category-sort-dropdown";
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
 * Results count + elegant sort dropdown + optional mobile filters.
 */
export function CategoryToolbar({
  total,
  poolTotal,
  className,
  trailing,
}: CategoryToolbarProps) {
  const { pending } = useCatalogUrl();

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-2.5",
        pending && "opacity-70 transition-opacity duration-150",
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

      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {trailing}
        <CategorySortDropdown />
      </div>
    </div>
  );
}
