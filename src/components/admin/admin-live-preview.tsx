"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Framed storefront preview panel for admin editors.
 */
export function AdminLivePreview({
  title = "Previa",
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "overflow-hidden rounded-[1.35rem] border border-border/80 bg-[#f4f7fa] shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border/60 bg-white px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Previa da loja
        </p>
        <h3 className="mt-0.5 font-display text-base font-semibold tracking-tight">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="relative p-3 sm:p-4">{children}</div>
    </aside>
  );
}
