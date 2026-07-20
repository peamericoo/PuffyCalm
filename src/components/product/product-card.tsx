"use client";

import { useState } from "react";
import { ShoppingBag, Star } from "lucide-react";
import { ProductLink } from "@/components/motion/product-link";
import { ProductMediaTransition } from "@/components/motion/product-media-transition";
import type { Product } from "@/types/product";
import { ProductImageCarousel } from "@/components/product/product-image-carousel";
import { WishlistHeart } from "@/components/wishlist/wishlist-heart";
import { useCartStore } from "@/lib/cart/store";
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
 * Solid CTAs (no backdrop-filter) so hover never “eats” the button.
 * Price uses brand-deep (trust), not coral (reserved for CTA).
 */
export function ProductCard({
  product,
  className,
  compact = false,
}: ProductCardProps) {
  const [active, setActive] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
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
        "group/card product-card relative flex h-full flex-col rounded-[1.2rem] bg-card outline-none",
        active && "is-active",
        className,
      )}
    >
      {/* Image alone clips — heart sits as sibling (not inside the link). */}
      <div
        className={cn(
          "relative z-[1] overflow-hidden rounded-t-[1.2rem]",
          compact ? "aspect-[1/1.02]" : "aspect-[4/5]",
        )}
      >
        <ProductLink
          slug={product.slug}
          className="absolute inset-0 block"
        >
          <ProductMediaTransition productId={product.id}>
            <ProductImageCarousel
              images={product.images}
              imageUrl={product.imageUrl}
              alt={product.imageAlt}
              paused={active}
              className="absolute inset-0 h-full w-full"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              showDots={!compact}
            />
          </ProductMediaTransition>
        </ProductLink>

        {off ? (
          <span className="pointer-events-none absolute left-2 top-2 z-[3] flex flex-col items-start gap-0.5 sm:left-2.5 sm:top-2.5">
            <span className="rounded-full bg-brand-deep px-2.5 py-1 text-[12px] font-bold tracking-wide text-white shadow-sm sm:px-3 sm:text-[13px]">
              −{off}%
            </span>
            {saveAmt > 0 ? (
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-brand-deep shadow-sm sm:text-[11px]">
                Save {formatMoney(saveAmt, product.currency)}
              </span>
            ) : null}
          </span>
        ) : null}

        <span className="absolute right-2 top-2 z-[4] sm:right-2.5 sm:top-2.5">
          <WishlistHeart product={product} size="sm" />
        </span>
      </div>

      <div
        className={cn(
          "relative z-[2] flex flex-1 flex-col rounded-b-[1.2rem] bg-card",
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
          <ProductLink slug={product.slug}>{product.name}</ProductLink>
        </h3>

        <div className="mt-auto flex flex-wrap items-end gap-x-2 gap-y-0.5 pt-1">
          <span
            className={cn(
              "price-value inline-block font-bold tracking-tight text-brand-deep",
              compact
                ? "text-[22px] sm:text-[24px]"
                : "text-[23px] sm:text-[25px]",
              active && "animate-price-pop",
              "group-hover/card:animate-price-pop",
            )}
          >
            {formatMoney(product.price, product.currency)}
          </span>
          {promo && product.compareAtPrice ? (
            <span className="pb-0.5 text-[13px] font-medium text-muted-foreground line-through">
              {formatMoney(product.compareAtPrice, product.currency)}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!product.inStock) return;
            addItem(product, 1);
          }}
          disabled={!product.inStock}
          className={cn(
            "add-cart-btn mt-2 flex w-full items-center justify-center gap-1.5 rounded-full font-semibold",
            compact ? "h-11 text-[13px]" : "h-11 text-sm",
            active && "is-active",
            !product.inStock && "pointer-events-none opacity-50",
          )}
        >
          <ShoppingBag
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-500",
              active && "animate-cart-icon",
              "group-hover/card:animate-cart-icon",
            )}
          />
          {product.inStock ? "Add to bag" : "Out of stock"}
        </button>
      </div>
    </article>
  );
}
