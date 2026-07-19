"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ProductSpec } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductSpecsProps {
  specs: ProductSpec[];
  className?: string;
}

/**
 * Specs: dense 2×2 on mobile, collapsible if many; editorial rows on desktop.
 */
export function ProductSpecs({ specs, className }: ProductSpecsProps) {
  const [open, setOpen] = useState(false);

  if (specs.length === 0) return null;

  return (
    <div className={cn(className)}>
      {/* ——— Mobile: compact chips + optional expand ——— */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          {specs.slice(0, open ? specs.length : 2).map((row) => (
            <div
              key={row.label}
              className="border border-border/70 bg-[#fafcfd] px-3 py-2.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-foreground/90">
                {row.value}
              </p>
            </div>
          ))}
        </div>

        {specs.length > 2 ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {open ? "Show less" : `+${specs.length - 2} more details`}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                open && "rotate-180",
              )}
              strokeWidth={2}
            />
          </button>
        ) : null}
      </div>

      {/* ——— Desktop: quiet label / value rows ——— */}
      <dl className="hidden border-t border-border/70 lg:block">
        {specs.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[6.5rem_1fr] items-baseline gap-6 border-b border-border/70 py-3.5"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {row.label}
            </dt>
            <dd className="text-[14px] leading-snug text-foreground/90">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
