"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { CartItemQuantity } from "@/components/cart/cart-item-quantity";
import type { CartLineItem } from "@/types/cart";
import { useCartStore } from "@/lib/cart/store";
import { lineOffPercent, lineSavings } from "@/lib/cart/savings";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./cart.module.css";

interface CartItemProps {
  item: CartLineItem;
  index: number;
  isOpen: boolean;
  leaving?: boolean;
  onNavigate?: () => void;
  onRequestRemove?: (productId: string) => void;
}

export function CartItem({
  item,
  index,
  isOpen,
  leaving = false,
  onNavigate,
  onRequestRemove,
}: CartItemProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal = item.price * item.quantity;
  const save = lineSavings(item);
  const offPct = lineOffPercent(item);
  const onSale = save > 0;

  const handleRemove = () => {
    if (onRequestRemove) {
      onRequestRemove(item.productId);
    } else {
      removeItem(item.productId);
    }
  };

  return (
    <li
      className={cn(styles.line, leaving && styles.lineLeaving)}
      style={
        isOpen && !leaving
          ? { animationDelay: `${50 + index * 48}ms` }
          : undefined
      }
    >
      <article className={styles.lineInner}>
        <Link
          href={`/product/${item.slug}`}
          onClick={onNavigate}
          className={styles.thumb}
        >
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
            fill
            className="object-cover"
            sizes="88px"
            quality={75}
          />
          {onSale && offPct > 0 ? (
            <span className={styles.saleMark}>−{offPct}%</span>
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/product/${item.slug}`}
                onClick={onNavigate}
                className="line-clamp-2 text-[13.5px] font-semibold leading-snug tracking-[-0.01em] text-foreground transition-colors hover:text-brand-deep md:text-[14px]"
              >
                {item.name}
              </Link>

              <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span
                  className={cn(
                    "text-[13px] font-semibold tabular-nums",
                    onSale ? "text-brand-deep" : "text-foreground",
                  )}
                >
                  {formatMoney(item.price, item.currency)}
                </span>
                {onSale && item.compareAtPrice ? (
                  <span className="text-[12px] tabular-nums text-muted-foreground line-through decoration-muted-foreground/65">
                    {formatMoney(item.compareAtPrice, item.currency)}
                  </span>
                ) : null}
              </div>

              {save > 0 ? (
                <p className="mt-0.5 text-[11.5px] font-semibold tabular-nums text-cta">
                  Save {formatMoney(save, item.currency)}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${item.name}`}
              className={styles.removeBtn}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2.5">
            <CartItemQuantity
              quantity={item.quantity}
              productName={item.name}
              onDecrease={() =>
                setQuantity(item.productId, item.quantity - 1)
              }
              onIncrease={() =>
                setQuantity(item.productId, item.quantity + 1)
              }
            />
            <p
              key={`${item.productId}-${lineTotal}`}
              className={cn(
                styles.moneyTick,
                "text-[14.5px] font-bold tabular-nums tracking-tight",
                onSale ? "text-brand-deep" : "text-foreground",
              )}
            >
              {formatMoney(lineTotal, item.currency)}
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}
