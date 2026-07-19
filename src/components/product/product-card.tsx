"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductImageCarousel } from "@/components/product/product-image-carousel";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

function percentOff(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/**
 * Compact, minimal product card.
 * Soft interaction layer (desktop hover + mobile tap/focus).
 * No category tags / bestseller noise — price + product do the talking.
 */
export function ProductCard({ product, className }: ProductCardProps) {
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
        "group/card product-card relative flex h-full flex-col overflow-hidden rounded-2xl bg-card outline-none",
        active && "is-active",
        className,
      )}
    >
      {/* Soft ambient glow on interaction */}
      <span
        className="product-card-glow pointer-events-none absolute inset-0 z-0"
        aria-hidden
      />

      <Link
        href={`/product/${product.slug}`}
        className="relative z-[1] block aspect-[5/6] overflow-hidden sm:aspect-[4/5]"
      >
        <ProductImageCarousel
          images={product.images}
          imageUrl={product.imageUrl}
          alt={product.imageAlt}
          paused={active}
          className="absolute inset-0"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
        />

        {off ? (
          <span className="absolute left-2.5 top-2.5 z-[3] rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm">
            −{off}%
          </span>
        ) : null}

        {/* Bottom fade so text never fights the photo */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-700 group-hover/card:opacity-100 group-[.is-active]/card:opacity-100"
          aria-hidden
        />
      </Link>

      <div className="relative z-[1] flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star
              className={cn(
                "h-3 w-3 fill-amber-400 text-amber-400 transition-transform duration-700",
                active && "animate-star-spin",
                "group-hover/card:animate-star-spin",
              )}
            />
            <span className="font-medium text-foreground/90">
              {product.rating}
            </span>
            <span className="text-border">·</span>
            <span>{product.reviewCount}</span>
          </div>
          {promo ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-success">
              Sale
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug tracking-tight text-foreground transition-colors duration-500 group-hover/card:text-brand-deep">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        {/* Description only peeks on interaction — keeps cards quiet at rest */}
        <p
          className={cn(
            "text-[12px] leading-relaxed text-muted-foreground transition-all duration-500 ease-out",
            "line-clamp-1 max-h-5 opacity-70",
            "group-hover/card:line-clamp-2 group-hover/card:max-h-10 group-hover/card:opacity-100",
            active && "line-clamp-2 max-h-10 opacity-100",
          )}
        >
          {product.shortDescription}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "text-[15px] font-semibold tracking-tight",
                promo ? "text-success" : "text-foreground",
              )}
            >
              {formatMoney(product.price, product.currency)}
            </span>
            {promo && product.compareAtPrice ? (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatMoney(product.compareAtPrice, product.currency)}
              </span>
            ) : null}
          </div>
        </div>

        <Link
          href={`/cart?add=${product.slug}`}
          className={cn(
            "product-card-cta pressable mt-0.5 flex h-9 w-full items-center justify-center rounded-full text-xs font-medium transition-all duration-500",
            promo
              ? "bg-success/10 text-success ring-1 ring-success/20 group-hover/card:bg-success group-hover/card:text-white group-hover/card:ring-success"
              : "bg-foreground/[0.04] text-foreground ring-1 ring-border/80 group-hover/card:bg-brand-deep group-hover/card:text-white group-hover/card:ring-brand-deep",
            active &&
              (promo
                ? "bg-success text-white ring-success"
                : "bg-brand-deep text-white ring-brand-deep"),
          )}
        >
          Add to cart
        </Link>
      </div>
    </article>
  );
}
