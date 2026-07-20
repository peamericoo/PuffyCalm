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
}

export function CartSummary({
  totals,
  className,
  showProgress = true,
}: CartSummaryProps) {
  const progress = Math.min(
    100,
    (totals.subtotal / totals.freeShippingThreshold) * 100,
  );

  return (
    <div className={cn("space-y-3", className)}>
      {showProgress && totals.itemCount > 0 ? (
        <div className="rounded-2xl bg-brand-soft/80 px-3.5 py-3 ring-1 ring-brand/10">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-brand-deep shadow-sm ring-1 ring-brand/15">
              <Truck className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium leading-snug text-foreground/90">
                {totals.qualifiesForFreeShipping ? (
                  <>You’ve unlocked <span className="font-semibold text-success">free shipping</span></>
                ) : (
                  <>
                    Add{" "}
                    <span className="font-semibold text-brand-deep">
                      {formatMoney(totals.amountToFreeShipping, totals.currency)}
                    </span>{" "}
                    for free shipping
                  </>
                )}
              </p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80 ring-1 ring-brand/10"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress to free shipping"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
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

      <dl className="space-y-2 text-[13.5px]">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {formatMoney(totals.subtotal, totals.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {totals.itemCount === 0
              ? "—"
              : totals.shipping === 0
                ? "Free"
                : formatMoney(totals.shipping, totals.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-border/70 pt-2.5">
          <dt className="text-[15px] font-semibold text-foreground">Total</dt>
          <dd className="text-[15px] font-semibold tabular-nums text-foreground">
            {formatMoney(totals.total, totals.currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
