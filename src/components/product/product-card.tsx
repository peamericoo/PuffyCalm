"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductImageCarousel } from "@/components/product/product-image-carousel";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Dense shop-grid card — still readable & conversion-forward */
  compact?: boolean;
}

function percentOff(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/**
 * Fixed-height product card — no layout shift on hover.
 * Larger type + bold sale callouts for conversion.
 */
export function ProductCard({
  product,
  className,
  compact = false,
}: ProductCardProps) {
  const [active, setActive] = useState(false);
  const off = percentOff(product.price, product.compareAtPrice);
  const promo = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );
  const saveAmt =
    promo && product.compareAtPrice
      ? product.compareAtPrice - product.price
      : 0;

  return (
    <article
      tabIndex={0}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setActive(false);
        }
      }}
      onTouchStart={() => setActive(true)}
      className={cn(
        "group/card product-card relative flex h-full flex-col overflow-hidden rounded-[1.2rem] bg-card outline-none",
        active && "is-active",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          "relative z-[1] block overflow-hidden",
          compact ? "aspect-[1/1.02]" : "aspect-[4/5]",
        )}
      >
        <ProductImageCarousel
          images={product.images}
          imageUrl={product.imageUrl}
          alt={product.imageAlt}
          paused={active}
          className="absolute inset-0"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          showDots={!compact}
        />

        {off ? (
          <span className="absolute left-2 top-2 z-[3] flex flex-col items-start gap-0.5 sm:left-2.5 sm:top-2.5">
            <span className="rounded-full bg-cta px-2.5 py-1 text-[12px] font-bold tracking-wide text-white shadow-[0_8px_18px_-8px_rgb(224_122_95/0.7)] sm:px-3 sm:text-[13px]">
              −{off}%
            </span>
            {saveAmt > 0 ? (
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-cta shadow-sm backdrop-blur-sm sm:text-[11px]">
                Save {formatMoney(saveAmt, product.currency)}
              </span>
            ) : null}
          </span>
        ) : null}

        <span
          className={cn(
            "absolute bottom-2 right-2 z-[3] flex h-9 w-9 items-center justify-center rounded-full glass-chip text-foreground transition-all duration-500",
            "opacity-0 translate-y-1 scale-90",
            "group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:scale-100",
            active && "opacity-100 translate-y-0 scale-100",
          )}
          aria-hidden
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </Link>

      <div
        className={cn(
          "relative z-[1] flex flex-1 flex-col",
          compact ? "gap-1.5 px-3 pb-3 pt-2.5" : "gap-2 px-3.5 pb-3.5 pt-3",
        )}
      >
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Star
            className={cn(
              "h-3.5 w-3.5 fill-amber-400 text-amber-400",
              active && "animate-star-spin",
              "group-hover/card:animate-star-spin",
            )}
          />
          <span className="font-semibold text-foreground">
            {product.rating}
          </span>
          <span className="text-border/80">·</span>
          <span className="truncate">{product.reviewCount} reviews</span>
        </div>

        <h3
          className={cn(
            "line-clamp-2 font-semibold leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover/card:text-brand-deep",
            compact
              ? "min-h-[2.6rem] text-[15px] sm:text-[16px]"
              : "min-h-[2.75rem] text-[16px] sm:text-[17px]",
          )}
        >
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-1.5">
            <span
              className={cn(
                "font-bold tracking-tight",
                compact ? "text-[18px] sm:text-[19px]" : "text-[19px] sm:text-xl",
                promo ? "text-cta" : "text-foreground",
              )}
            >
              {formatMoney(product.price, product.currency)}
            </span>
            {promo && product.compareAtPrice ? (
              <span className="text-[13px] font-medium text-muted-foreground line-through">
                {formatMoney(product.compareAtPrice, product.currency)}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href={`/cart?add=${product.slug}`}
          className={cn(
            "pressable mt-1.5 flex w-full items-center justify-center rounded-full font-semibold transition-all duration-300",
            compact ? "h-10 text-[13px]" : "h-10 text-sm",
            "glass-btn text-brand-deep",
            "group-hover/card:bg-cta group-hover/card:text-white group-hover/card:shadow-[0_8px_20px_-10px_rgb(224_122_95/0.65)]",
            active &&
              "bg-cta text-white shadow-[0_8px_20px_-10px_rgb(224_122_95/0.65)]",
          )}
        >
          Add to cart
        </Link>
      </div>
    </article>
  );
}
