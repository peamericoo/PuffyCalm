"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductImageCarousel } from "@/components/product/product-image-carousel";
import { Price } from "@/components/product/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
  socialProof?: string;
}

function percentOff(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

function isPromo(product: Product) {
  return Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  ) || product.badges?.includes("sale");
}

/**
 * Interactive product card — hover (desktop) + tap/focus (mobile).
 * Image always uses ProductImageCarousel when gallery exists.
 */
export function ProductCard({
  product,
  className,
  socialProof,
}: ProductCardProps) {
  const [active, setActive] = useState(false);
  const off = percentOff(product.price, product.compareAtPrice);
  const promo = isPromo(product);
  const proof =
    socialProof ??
    (product.reviewCount >= 100
      ? `${product.reviewCount}+ happy customers`
      : `${product.reviewCount} verified reviews`);

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
        "group/card flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-card shadow-sm ring-1 ring-border/70 transition-all duration-300 outline-none",
        "hover:-translate-y-1.5 hover:shadow-[0_22px_48px_-28px_rgb(26_35_50/0.35)] hover:ring-brand/35",
        "focus-visible:-translate-y-1.5 focus-visible:shadow-[0_22px_48px_-28px_rgb(26_35_50/0.35)] focus-visible:ring-2 focus-visible:ring-brand/40",
        active &&
          "is-active/card -translate-y-1.5 shadow-[0_22px_48px_-28px_rgb(26_35_50/0.35)] ring-brand/35",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden sm:aspect-square"
      >
        <ProductImageCarousel
          images={product.images}
          imageUrl={product.imageUrl}
          alt={product.imageAlt}
          paused={active}
          className="absolute inset-0"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
        />

        <div className="absolute left-3 top-3 z-[3] flex flex-wrap gap-1.5">
          {product.badges?.slice(0, 2).map((badge) => (
            <Badge
              key={badge}
              variant={
                badge === "sale"
                  ? "sale"
                  : badge === "new"
                    ? "new"
                    : badge === "bestseller"
                      ? "soft"
                      : "muted"
              }
              className="backdrop-blur-sm"
            >
              {badge === "bestseller"
                ? "Bestseller"
                : badge === "new"
                  ? "New"
                  : badge === "limited"
                    ? "Limited"
                    : "Sale"}
            </Badge>
          ))}
          {off ? (
            <Badge variant="sale" className="backdrop-blur-sm">
              −{off}%
            </Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star
              className={cn(
                "h-3.5 w-3.5 fill-amber-400 text-amber-400 transition-transform duration-500",
                active && "animate-star-spin",
                "group-hover/card:animate-star-spin",
              )}
            />
            <span className="font-semibold text-foreground">
              {product.rating}
            </span>
            <span className="text-border">·</span>
            <span className="line-clamp-1">{proof}</span>
          </div>

          {product.categoryLabel ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand-deep/80">
              {product.categoryLabel}
            </p>
          ) : null}

          <h3 className="text-[15px] font-medium leading-snug tracking-tight text-foreground transition-colors group-hover/card:text-brand-deep">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>

          <p
            className={cn(
              "text-sm leading-relaxed text-muted-foreground transition-all duration-300 origin-top",
              active || "line-clamp-2",
              active && "line-clamp-none scale-[1.02] text-[0.9375rem] text-foreground/80",
              "group-hover/card:line-clamp-none group-hover/card:scale-[1.02] group-hover/card:text-[0.9375rem] group-hover/card:text-foreground/80",
            )}
          >
            {product.shortDescription}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
          />
          {promo && product.compareAtPrice ? (
            <span className="text-[11px] font-semibold text-success">
              Save {formatMoney(product.compareAtPrice - product.price)}
            </span>
          ) : null}
        </div>

        <div className="mt-auto space-y-2 pt-1">
          <Button
            asChild
            variant={promo ? "soft" : "default"}
            size="sm"
            className={cn(
              "pressable w-full transition-all duration-300",
              promo &&
                "bg-success text-white hover:bg-success/90 group-hover/card:bg-success group-hover/card:text-white",
              !promo &&
                "group-hover/card:bg-brand-deep group-hover/card:text-white",
              active && promo && "bg-success text-white",
              active && !promo && "bg-brand-deep text-white",
            )}
          >
            <Link href={`/cart?add=${product.slug}`}>Add to cart</Link>
          </Button>
          <Link
            href={`/product/${product.slug}`}
            className={cn(
              "block text-center text-xs font-medium transition-colors duration-300",
              "text-brand-deep hover:text-foreground",
              active && "text-foreground underline-offset-2",
            )}
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
