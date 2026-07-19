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
  /** Ultra-dense grid card for the shop stage */
  compact?: boolean;
}

function percentOff(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/**
 * Fixed-height product card — no layout shift on hover.
 * Soft glass CTA + coral accent (site palette only).
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
        "group/card product-card relative flex h-full flex-col overflow-hidden rounded-[1.15rem] bg-card outline-none",
        active && "is-active",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          "relative z-[1] block overflow-hidden",
          compact ? "aspect-square" : "aspect-[4/5]",
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
          <span className="absolute left-2 top-2 z-[3] rounded-full bg-cta/95 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm backdrop-blur-sm">
            −{off}%
          </span>
        ) : null}

        {/* Glass add chip — appears on hover without resizing card */}
        <span
          className={cn(
            "absolute bottom-2 right-2 z-[3] flex h-8 w-8 items-center justify-center rounded-full glass-chip text-foreground transition-all duration-500",
            "opacity-0 translate-y-1 scale-90",
            "group-hover/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:scale-100",
            active && "opacity-100 translate-y-0 scale-100",
          )}
          aria-hidden
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </Link>

      <div
        className={cn(
          "relative z-[1] flex flex-1 flex-col",
          compact ? "gap-1 px-2.5 pb-2.5 pt-2" : "gap-1.5 px-3 pb-3 pt-2.5",
        )}
      >
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Star
            className={cn(
              "h-2.5 w-2.5 fill-amber-400 text-amber-400",
              active && "animate-star-spin",
              "group-hover/card:animate-star-spin",
            )}
          />
          <span className="font-medium text-foreground/85">
            {product.rating}
          </span>
          <span className="text-border/80">·</span>
          <span className="truncate">{product.reviewCount}</span>
        </div>

        <h3
          className={cn(
            "line-clamp-2 font-medium leading-snug tracking-tight text-foreground transition-colors duration-300 group-hover/card:text-brand-deep",
            compact ? "min-h-[2.25rem] text-[12.5px]" : "min-h-[2.5rem] text-[13.5px]",
          )}
        >
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="text-[13.5px] font-semibold tracking-tight text-foreground">
              {formatMoney(product.price, product.currency)}
            </span>
            {promo && product.compareAtPrice ? (
              <span className="truncate text-[10px] text-muted-foreground line-through">
                {formatMoney(product.compareAtPrice, product.currency)}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href={`/cart?add=${product.slug}`}
          className={cn(
            "pressable mt-1 flex w-full items-center justify-center rounded-full text-[11px] font-medium transition-all duration-300",
            compact ? "h-8" : "h-9",
            "glass-btn text-brand-deep",
            "group-hover/card:bg-cta group-hover/card:text-white group-hover/card:shadow-[0_8px_20px_-10px_rgb(224_122_95/0.65)]",
            active &&
              "bg-cta text-white shadow-[0_8px_20px_-10px_rgb(224_122_95/0.65)]",
          )}
        >
          Add
        </Link>
      </div>
    </article>
  );
}
