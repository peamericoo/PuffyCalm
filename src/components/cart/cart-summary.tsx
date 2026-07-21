"use client";

import { Truck } from "lucide-react";
import type { CartTotals } from "@/types/cart";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CartSummaryProps {
  totals: CartTotals;
  className?: string;
  /** Show free-shipping progress bar */
  showProgress?: boolean;
  /** Aggregate sale savings (optional, drawer highlights this) */
  savings?: number;
  density?: "drawer" | "page";
}

export function CartSummary({
  totals,
  className,
  showProgress = true,
  savings = 0,
  density = "page",
}: CartSummaryProps) {
  const progress = Math.min(
    100,
    (totals.subtotal / totals.freeShippingThreshold) * 100,
  );
  const compact = density === "drawer";

  return (
    <div className={cn(compact ? "space-y-2.5" : "space-y-3", className)}>
      {showProgress && totals.itemCount > 0 ? (
        <div
          className={cn(
            "rounded-2xl ring-1",
            totals.qualifiesForFreeShipping
              ? "bg-success/10 ring-success/20"
              : "bg-brand-soft/90 ring-brand/12",
            compact ? "px-3 py-2.5" : "px-3.5 py-3",
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1",
                totals.qualifiesForFreeShipping
                  ? "text-success ring-success/25"
                  : "text-brand-deep ring-brand/15",
              )}
            >
              <Truck className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium leading-snug text-foreground/90">
                {totals.qualifiesForFreeShipping ? (
                  <>
                    <span className="font-semibold text-success">
                      Free shipping
                    </span>{" "}
                    unlocked
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-brand-deep">
                      {formatMoney(totals.amountToFreeShipping, totals.currency)}
                    </span>{" "}
                    away from free shipping
                  </>
                )}
              </p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/85 ring-1 ring-black/5"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress to free shipping"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500 ease-out",
                    totals.qualifiesForFreeShipping
                      ? "bg-success"
                      : "bg-brand-deep",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <dl className={cn("text-[13.5px]", compact ? "space-y-1.5" : "space-y-2")}>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatMoney(totals.subtotal, totals.currency)}
          </dd>
        </div>

        {savings > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="font-medium text-cta">Sale savings</dt>
            <dd className="font-semibold tabular-nums text-cta">
              −{formatMoney(savings, totals.currency)}
            </dd>
          </div>
        ) : null}

        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd
            className={cn(
              "font-medium tabular-nums",
              totals.shipping === 0 && totals.itemCount > 0
                ? "text-success"
                : "text-foreground",
            )}
          >
            {totals.itemCount === 0
              ? "—"
              : totals.shipping === 0
                ? "Free"
                : formatMoney(totals.shipping, totals.currency)}
          </dd>
        </div>

        <div
          className={cn(
            "flex justify-between gap-3 border-t border-border/60",
            compact ? "pt-2" : "pt-2.5",
          )}
        >
          <dt className="text-[15px] font-semibold text-foreground">Total</dt>
          <dd className="text-[16px] font-bold tabular-nums tracking-tight text-brand-deep">
            {formatMoney(totals.total, totals.currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
