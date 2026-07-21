"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
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
  const onSale = Boolean(
    item.compareAtPrice && item.compareAtPrice > item.price,
  );
  const unitSave =
    onSale && item.compareAtPrice
      ? item.compareAtPrice - item.price
      : 0;
  const lineSave = unitSave * item.quantity;
  const offPct =
    onSale && item.compareAtPrice
      ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
      : 0;

  return (
    <article
      className={cn(
        "flex gap-3",
        isDrawer ? "p-2.5 sm:px-0 sm:py-3.5 md:p-0 md:py-3.5" : "gap-4 py-5 sm:gap-5",
        className,
      )}
    >
      <Link
        href={`/product/${item.slug}`}
        onClick={onNavigate}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl bg-brand-soft ring-1 ring-border/50",
          "transition-transform duration-200 active:scale-[0.98]",
          isDrawer ? "h-[4.25rem] w-[4.25rem]" : "h-24 w-24 sm:h-28 sm:w-28",
        )}
      >
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          fill
          className="object-cover"
          sizes={isDrawer ? "68px" : "112px"}
          quality={72}
        />
        {onSale && offPct > 0 ? (
          <span
            className={cn(
              "absolute left-1 top-1 rounded-md bg-cta px-1 py-px",
              "text-[9px] font-bold tracking-wide text-white shadow-sm",
            )}
          >
            −{offPct}%
          </span>
        ) : null}
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

            <div
              className={cn(
                "mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5",
                isDrawer ? "text-[12.5px]" : "text-sm",
              )}
            >
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  onSale ? "text-brand-deep" : "text-foreground",
                )}
              >
                {formatMoney(item.price, item.currency)}
              </span>
              {onSale && item.compareAtPrice ? (
                <span className="tabular-nums text-muted-foreground line-through decoration-muted-foreground/70">
                  {formatMoney(item.compareAtPrice, item.currency)}
                </span>
              ) : null}
              {lineSave > 0 ? (
                <span className="font-semibold tabular-nums text-cta">
                  Save {formatMoney(lineSave, item.currency)}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Remove ${item.name}`}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              "text-muted-foreground transition-[background-color,color,transform] duration-150",
              "hover:bg-cta/10 hover:text-cta active:scale-90",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div
            className={cn(
              "inline-flex h-9 items-center rounded-full border border-border/80 bg-white",
              "shadow-[0_1px_0_rgb(255_255_255/0.8)_inset]",
            )}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={item.quantity <= 1}
              onClick={() => setQuantity(item.productId, item.quantity - 1)}
              className={cn(
                "flex h-9 w-9 items-center justify-center text-foreground",
                "transition-[background-color,transform] duration-150",
                "hover:bg-brand-soft active:scale-90 disabled:opacity-30",
              )}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <span className="min-w-[1.35rem] text-center text-[13px] font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={item.quantity >= MAX_LINE_QTY}
              onClick={() => setQuantity(item.productId, item.quantity + 1)}
              className={cn(
                "flex h-9 w-9 items-center justify-center text-foreground",
                "transition-[background-color,transform] duration-150",
                "hover:bg-brand-soft active:scale-90 disabled:opacity-30",
              )}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>

          <p
            className={cn(
              "font-bold tabular-nums tracking-tight",
              isDrawer ? "text-[14px]" : "text-[15px]",
              onSale ? "text-brand-deep" : "text-foreground",
            )}
          >
            {formatMoney(lineTotal, item.currency)}
          </p>
        </div>
      </div>
    </article>
  );
}
