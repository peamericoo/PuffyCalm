"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/format";
import iconStyles from "./product-icons.module.css";
import { cn } from "@/lib/utils";

interface ProductBuyBoxProps {
  slug: string;
  price: number;
  currency?: string;
  inStock?: boolean;
  className?: string;
}

/**
 * Always one row: compact qty + ATC + wishlist.
 * Mobile no longer stacks into three heavy blocks.
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
    <div className={cn("flex items-stretch gap-0", className)}>
      {/* Qty — fixed compact width */}
      <div className="inline-flex h-12 w-[6.75rem] shrink-0 items-center justify-between border border-foreground/15 border-r-0 bg-white sm:h-14 sm:w-32">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className={cn(
            iconStyles.minus,
            "flex h-full w-9 items-center justify-center text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-30 sm:w-10",
          )}
        >
          <Minus
            className={cn(iconStyles.iconSvg, "h-3.5 w-3.5")}
            strokeWidth={2.25}
          />
        </button>
        <span className="min-w-[1.25rem] text-center text-[14px] font-semibold tabular-nums sm:text-[15px]">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(9, q + 1))}
          disabled={qty >= 9}
          aria-label="Increase quantity"
          className={cn(
            iconStyles.plus,
            "flex h-full w-9 items-center justify-center text-foreground transition-colors hover:bg-foreground/[0.04] disabled:opacity-30 sm:w-10",
          )}
        >
          <Plus
            className={cn(iconStyles.iconSvg, "h-3.5 w-3.5")}
            strokeWidth={2.25}
          />
        </button>
      </div>

      {/* ATC — grows */}
      <Link
        href={inStock ? `/cart?add=${slug}&qty=${qty}` : "#"}
        aria-disabled={!inStock}
        className={cn(
          iconStyles.cart,
          "inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 bg-foreground px-3",
          "text-[11px] font-semibold uppercase tracking-[0.1em] text-white sm:h-14 sm:gap-2 sm:px-6 sm:text-[13px] sm:tracking-[0.12em]",
          "transition-colors hover:bg-foreground/90 active:scale-[0.99]",
          !inStock && "pointer-events-none opacity-45",
        )}
      >
        <ShoppingBag
          className={cn(iconStyles.iconSvg, "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4")}
          strokeWidth={2.1}
        />
        <span className="truncate">
          {inStock
            ? `Add · ${formatMoney(total, currency)}`
            : "Out of stock"}
        </span>
      </Link>

      {/* Wishlist */}
      <button
        type="button"
        onClick={() => setWish((w) => !w)}
        aria-label={wish ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={wish}
        className={cn(
          iconStyles.heart,
          "inline-flex h-12 w-12 shrink-0 items-center justify-center border border-foreground/15 border-l-0 bg-white sm:h-14 sm:w-14",
          "text-foreground transition-colors hover:bg-foreground/[0.03]",
          wish && "border-cta/40 text-cta",
        )}
      >
        <Heart
          className={cn(iconStyles.iconSvg, "h-4 w-4", wish && "fill-current")}
          strokeWidth={1.9}
        />
      </button>
    </div>
  );
}
