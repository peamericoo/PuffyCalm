"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogFacets } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

interface CategoryMobileFiltersProps {
  facets: CatalogFacets;
  className?: string;
}

/**
 * Mobile filter sheet — same controls as desktop rail.
 */
export function CategoryMobileFilters({
  facets,
  className,
}: CategoryMobileFiltersProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className={cn("lg:hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 border border-border/80 bg-white px-3 text-[12.5px] font-medium text-foreground"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
        Filters
        {hasActive ? (
          <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-brand-deep" />
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:p-6">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal
            aria-label="Filters"
            className={cn(
              "relative z-[1] max-h-[85vh] overflow-y-auto bg-white p-5 shadow-xl",
              "sm:mx-auto sm:w-full sm:max-w-md sm:rounded-sm",
              pending && "opacity-80",
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[15px] font-semibold text-foreground">Filters</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <section className="border-b border-border/60 pb-4">
              <p className="mb-2.5 text-[12px] font-semibold">Availability</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={stock === "in"}
                    onChange={() => setStock(stock === "in" ? "all" : "in")}
                    className="accent-foreground"
                  />
                  In stock ({facets.stock.in})
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={stock === "out"}
                    onChange={() => setStock(stock === "out" ? "all" : "out")}
                    className="accent-foreground"
                  />
                  Out of stock ({facets.stock.out})
                </label>
              </div>
            </section>

            {facets.types.length > 0 ? (
              <section className="border-b border-border/60 py-4">
                <p className="mb-2.5 text-[12px] font-semibold">Collection</p>
                <div className="flex flex-col gap-2">
                  {facets.types.map((t) => (
                    <label
                      key={t.slug}
                      className="flex items-center gap-2 text-[13px]"
                    >
                      <input
                        type="checkbox"
                        checked={types.includes(t.slug)}
                        onChange={() => toggleType(t.slug)}
                        className="accent-foreground"
                      />
                      {t.name} ({t.count})
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="py-4">
              <p className="mb-2.5 text-[12px] font-semibold">Offers</p>
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={sale}
                  onChange={() => setSale(!sale)}
                  className="accent-foreground"
                  disabled={facets.sale === 0}
                />
                On sale ({facets.sale})
              </label>
            </section>

            <div className="mt-2 flex gap-2">
              {hasActive ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-11 flex-1 border border-border text-[13px] font-medium"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-11 flex-1 bg-foreground text-[13px] font-semibold text-white"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
