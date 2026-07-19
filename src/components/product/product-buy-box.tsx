"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
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
 * Minimal qty stepper + primary cart CTA (reference: quiet commerce).
 */
export function ProductBuyBox({
  slug,
  price,
  currency = "USD",
  inStock = true,
  className,
}: ProductBuyBoxProps) {
  const [qty, setQty] = useState(1);

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => Math.min(9, q + 1));

  const total = price * qty;

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <div
        className={cn(
          "inline-flex h-12 items-center justify-between rounded-full border border-border/80 bg-white",
          "px-1.5 shadow-sm sm:w-[8.5rem]",
        )}
      >
        <button
          type="button"
          onClick={dec}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-brand-soft disabled:opacity-35"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
        <span className="min-w-[1.5rem] text-center text-[15px] font-semibold tabular-nums">
          {qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={qty >= 9}
          aria-label="Increase quantity"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-brand-soft disabled:opacity-35"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </div>

      <Button
        asChild
        variant="dark"
        size="lg"
        className="h-12 flex-1 rounded-full px-6 text-[13px] font-semibold tracking-wide sm:min-w-[14rem] sm:flex-none sm:px-8"
        disabled={!inStock}
      >
        <Link
          href={inStock ? `/cart?add=${slug}&qty=${qty}` : "#"}
          aria-disabled={!inStock}
          className={cn(!inStock && "pointer-events-none opacity-50")}
        >
          <ShoppingBag className="h-4 w-4" />
          {inStock
            ? `Add to cart · ${formatMoney(total, currency)}`
            : "Out of stock"}
        </Link>
      </Button>

      <Button
        asChild
        variant="outline"
        size="icon"
        className="h-12 w-12 shrink-0 rounded-full border-border/80"
      >
        <Link href="/wishlist" aria-label="Save to wishlist">
          <Heart className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
