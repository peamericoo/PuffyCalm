"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import type { Product } from "@/types/product";
import { useCartStore } from "@/lib/cart/store";
import { formatMoney } from "@/lib/format";
import iconStyles from "./product-icons.module.css";
import { cn } from "@/lib/utils";

interface ProductBuyBoxProps {
  product: Product;
  className?: string;
}

/**
 * Qty + Add to bag (opens drawer) + Buy now (checkout) + wishlist.
 * Mobile: stacked for clarity; desktop: primary row + express row.
 */
export function ProductBuyBox({ product, className }: ProductBuyBoxProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const addItemQuiet = useCartStore((s) => s.addItemQuiet);
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const total = product.price * qty;
  const inStock = product.inStock;

  const handleAdd = () => {
    if (!inStock) return;
    addItem(product, qty);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  const handleBuyNow = () => {
    if (!inStock) return;
    addItemQuiet(product, qty);
    router.push("/checkout");
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-stretch gap-0">
        {/* Qty */}
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

        {/* Add to bag */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className={cn(
            iconStyles.cart,
            "inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 bg-foreground px-3",
            "text-[11px] font-semibold uppercase tracking-[0.1em] text-white sm:h-14 sm:gap-2 sm:px-6 sm:text-[13px] sm:tracking-[0.12em]",
            "transition-colors duration-200 hover:bg-success active:scale-[0.99]",
            !inStock && "pointer-events-none opacity-45",
            justAdded && "bg-success",
          )}
        >
          <ShoppingBag
            className={cn(
              iconStyles.iconSvg,
              "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
            )}
            strokeWidth={2.1}
          />
          <span className="truncate">
            {!inStock
              ? "Out of stock"
              : justAdded
                ? "Added"
                : `Add · ${formatMoney(total, product.currency)}`}
          </span>
        </button>

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

      {/* Buy now — skip bag, go straight to checkout */}
      <button
        type="button"
        onClick={handleBuyNow}
        disabled={!inStock}
        className={cn(
          "pressable inline-flex h-11 w-full items-center justify-center gap-2 rounded-none",
          "bg-cta text-[12px] font-semibold uppercase tracking-[0.12em] text-white",
          "transition-colors hover:bg-cta-hover sm:h-12 sm:text-[13px]",
          !inStock && "pointer-events-none opacity-45",
        )}
      >
        <Zap className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        Buy now · {formatMoney(total, product.currency)}
      </button>
    </div>
  );
}
