"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
 * Square qty + oversized black ATC.
 * Each icon has its own hover animation (same system as top-bar nav icons).
 */
export function ProductBuyBox({
  slug,
  price,
  currency = "USD",
  inStock = true,
  className,
}: ProductBuyBoxProps) {
  const [qty, setQty] = useState(1);
  const [qtyBump, setQtyBump] = useState(false);
  const [wish, setWish] = useState(false);
  const prevQty = useRef(qty);

  useEffect(() => {
    if (prevQty.current === qty) return;
    prevQty.current = qty;
    setQtyBump(true);
    const t = window.setTimeout(() => setQtyBump(false), 280);
    return () => window.clearTimeout(t);
  }, [qty]);

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(9, q + 1));
  const total = price * qty;

  return (
    <div
      className={cn(
        "flex flex-col gap-0 sm:flex-row sm:items-stretch",
        className,
      )}
    >
      {/* Square stepper — flush with ATC */}
      <div
        className={cn(
          "inline-flex h-14 items-center justify-between border border-foreground/15 bg-white",
          "sm:h-16 sm:w-[8.75rem] sm:border-r-0",
        )}
      >
        <button
          type="button"
          onClick={dec}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className="pdp-icon pdp-icon--minus flex h-full w-12 items-center justify-center text-foreground transition-colors duration-200 hover:bg-foreground/[0.04] active:bg-foreground/[0.07] disabled:opacity-30"
        >
          <Minus className="pdp-icon-svg h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        <span
          key={qty}
          className={cn(
            "min-w-[1.75rem] text-center text-[16px] font-semibold tabular-nums tracking-tight",
            qtyBump && "pdp-qty-bump",
          )}
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={qty >= 9}
          aria-label="Increase quantity"
          className="pdp-icon pdp-icon--plus flex h-full w-12 items-center justify-center text-foreground transition-colors duration-200 hover:bg-foreground/[0.04] active:bg-foreground/[0.07] disabled:opacity-30"
        >
          <Plus className="pdp-icon-svg h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      {/* Hero ATC */}
      <Link
        href={inStock ? `/cart?add=${slug}&qty=${qty}` : "#"}
        aria-disabled={!inStock}
        className={cn(
          "pdp-atc pdp-icon pdp-icon--cart group relative inline-flex h-14 flex-1 items-center justify-center gap-2.5 overflow-hidden",
          "bg-foreground px-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-white",
          "transition-[transform,box-shadow,background-color] duration-300 ease-out",
          "sm:h-16 sm:min-w-[16rem] sm:px-10 sm:text-[14px]",
          "hover:bg-foreground/92 hover:shadow-[0_14px_32px_-14px_rgb(26_35_50/0.55)]",
          "active:scale-[0.985]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2",
          !inStock && "pointer-events-none opacity-45",
        )}
      >
        <span aria-hidden className="pdp-atc-shine" />
        <ShoppingBag
          className="pdp-icon-svg h-[1.05rem] w-[1.05rem]"
          strokeWidth={2.1}
        />
        <span className="relative">
          {inStock
            ? `Add to cart · ${formatMoney(total, currency)}`
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
          "pdp-icon pdp-icon--heart inline-flex h-14 w-14 shrink-0 items-center justify-center border border-foreground/15 bg-white",
          "text-foreground transition-all duration-250 ease-out",
          "hover:border-foreground/40 hover:bg-foreground/[0.03]",
          "active:scale-95 sm:h-16 sm:w-16 sm:border-l-0",
          wish && "border-cta/50 bg-cta/5 text-cta",
        )}
      >
        <Heart
          className={cn(
            "pdp-icon-svg h-[1.15rem] w-[1.15rem]",
            wish && "fill-current",
          )}
          strokeWidth={1.9}
        />
      </button>
    </div>
  );
}
