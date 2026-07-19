"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductBuyBoxProps {
  slug: string;
  price: number;
  currency?: string;
  inStock?: boolean;
  className?: string;
}

/**
 * Square qty stepper + solid black ATC + wishlist.
 */
export function ProductBuyBox({
  slug,
  price,
  currency = "USD",
  inStock = true,
  className,
}: ProductBuyBoxProps) {
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);

  const total = price * qty;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0",
        className,
      )}
    >
      <div className="inline-flex h-13 items-center justify-between border border-foreground/15 bg-white sm:h-14 sm:w-36 sm:border-r-0">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className="pdp-icon pdp-icon--minus flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-30"
        >
          <Minus className="pdp-icon-svg h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        <span className="min-w-[1.5rem] text-center text-[15px] font-semibold tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(9, q + 1))}
          disabled={qty >= 9}
          aria-label="Increase quantity"
          className="pdp-icon pdp-icon--plus flex h-full w-11 items-center justify-center text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-30"
        >
          <Plus className="pdp-icon-svg h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <Link
        href={inStock ? `/cart?add=${slug}&qty=${qty}` : "#"}
        aria-disabled={!inStock}
        className={cn(
          "pdp-icon pdp-icon--cart group inline-flex h-13 flex-1 items-center justify-center gap-2 bg-foreground px-6",
          "text-[13px] font-semibold uppercase tracking-[0.12em] text-white",
          "transition-colors hover:bg-foreground/90 active:scale-[0.99]",
          "sm:h-14 sm:min-w-[14rem] sm:px-8",
          !inStock && "pointer-events-none opacity-45",
        )}
      >
        <ShoppingBag className="pdp-icon-svg h-4 w-4" strokeWidth={2.1} />
        {inStock
          ? `Add to cart · ${formatMoney(total, currency)}`
          : "Out of stock"}
      </Link>

      <button
        type="button"
        onClick={() => setWish((w) => !w)}
        aria-label={wish ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={wish}
        className={cn(
          "pdp-icon pdp-icon--heart inline-flex h-13 w-13 shrink-0 items-center justify-center border border-foreground/15 bg-white",
          "text-foreground transition-colors hover:bg-foreground/[0.03]",
          "sm:h-14 sm:w-14 sm:border-l-0",
          wish && "border-cta/40 text-cta",
        )}
      >
        <Heart
          className={cn("pdp-icon-svg h-4 w-4", wish && "fill-current")}
          strokeWidth={1.9}
        />
      </button>
    </div>
  );
}
