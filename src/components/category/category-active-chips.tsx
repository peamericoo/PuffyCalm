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
 * Active filter chips + Clear all (Estore toolbar row).
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

  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className="inline-flex items-center gap-1 border border-border/80 bg-white px-2.5 py-1 text-[11.5px] font-medium text-foreground transition hover:border-foreground/30"
        >
          {c.label}
          <X className="h-3 w-3 opacity-50" strokeWidth={2} />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="px-1.5 text-[12px] font-medium text-brand-deep transition hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}
