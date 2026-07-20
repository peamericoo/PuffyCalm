"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import type { CartLineItem } from "@/types/cart";
import { useCartStore } from "@/lib/cart/store";
import { MAX_LINE_QTY } from "@/lib/cart/constants";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CartLineRowProps {
  item: CartLineItem;
  /** Compact for drawer; roomier on full cart page */
  density?: "drawer" | "page";
  onNavigate?: () => void;
  className?: string;
}

export function CartLineRow({
  item,
  density = "drawer",
  onNavigate,
  className,
}: CartLineRowProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const lineTotal = item.price * item.quantity;
  const isDrawer = density === "drawer";

  return (
    <article
      className={cn(
        "flex gap-3",
        isDrawer ? "py-3.5" : "gap-4 py-5 sm:gap-5",
        className,
      )}
    >
      <Link
        href={`/product/${item.slug}`}
        onClick={onNavigate}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-brand-soft ring-1 ring-border/60",
          isDrawer ? "h-[4.5rem] w-[4.5rem]" : "h-24 w-24 sm:h-28 sm:w-28",
        )}
      >
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          fill
          className="object-cover"
          sizes={isDrawer ? "72px" : "112px"}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              onClick={onNavigate}
              className={cn(
                "line-clamp-2 font-semibold leading-snug text-foreground transition-colors hover:text-brand-deep",
                isDrawer ? "text-[13.5px]" : "text-[15px] sm:text-base",
              )}
            >
              {item.name}
            </Link>
            <p
              className={cn(
                "mt-0.5 tabular-nums text-muted-foreground",
                isDrawer ? "text-[12.5px]" : "text-sm",
              )}
            >
              {formatMoney(item.price, item.currency)}
              {item.compareAtPrice && item.compareAtPrice > item.price ? (
                <span className="ml-1.5 line-through opacity-70">
                  {formatMoney(item.compareAtPrice, item.currency)}
                </span>
              ) : null}
            </p>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="inline-flex h-9 items-center rounded-full border border-border bg-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-brand-soft disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <span className="min-w-[1.25rem] text-center text-[13px] font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={item.quantity >= MAX_LINE_QTY}
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              className="flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-brand-soft disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>

          <p
            className={cn(
              "font-semibold tabular-nums text-foreground",
              isDrawer ? "text-[13.5px]" : "text-[15px]",
            )}
          >
            {formatMoney(lineTotal, item.currency)}
          </p>
        </div>
      </div>
    </article>
  );
}
