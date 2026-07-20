"use client";

import { X } from "lucide-react";
import type { CatalogFacets } from "@/lib/catalog/types";
import { useCatalogUrl } from "@/components/category/use-catalog-url";
import { cn } from "@/lib/utils";

interface CategoryActiveChipsProps {
  facets: CatalogFacets;
  className?: string;
}

/**
 * Compact active filter chips under toolbar (desktop mirror of panel chips).
 * Hidden when no filters — panel already shows chips on desktop.
 */
export function CategoryActiveChips({
  facets,
  className,
}: CategoryActiveChipsProps) {
  const {
    stock,
    types,
    sale,
    hasActive,
    setStock,
    toggleType,
    setSale,
    clearAll,
  } = useCatalogUrl();

  if (!hasActive) return null;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (stock === "in") {
    chips.push({
      key: "stock-in",
      label: "In stock",
      onRemove: () => setStock("all"),
    });
  }
  if (stock === "out") {
    chips.push({
      key: "stock-out",
      label: "Out of stock",
      onRemove: () => setStock("all"),
    });
  }
  for (const slug of types) {
    const meta = facets.types.find((t) => t.slug === slug);
    chips.push({
      key: `type-${slug}`,
      label: meta?.name ?? slug,
      onRemove: () => toggleType(slug),
    });
  }
  if (sale) {
    chips.push({
      key: "sale",
      label: "On sale",
      onRemove: () => setSale(false),
    });
  }

  // Sort-only active doesn't need chips row
  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 sm:gap-2 lg:hidden",
        className,
      )}
    >
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
            "bg-white/70 text-brand-deep border border-white/70",
            "shadow-[0_1px_0_rgb(255_255_255/0.8)_inset]",
            "transition hover:border-brand-deep/40 hover:text-foreground",
          )}
        >
          {c.label}
          <X className="h-3 w-3 opacity-50" strokeWidth={2.25} />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="px-1.5 text-[12px] font-semibold text-brand-deep transition hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}
