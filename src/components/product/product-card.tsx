import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/types/product";
import { Price } from "@/components/product/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Social proof line under rating (conversion science) */
  socialProof?: string;
}

function percentOff(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/**
 * Conversion-tuned product card:
 * - Rating always visible (social proof)
 * - Price anchoring with % off
 * - One dominant CTA (coral) reduces choice paralysis
 * - Secondary path as quiet text link
 */
export function ProductCard({
  product,
  className,
  socialProof,
}: ProductCardProps) {
  const off = percentOff(product.price, product.compareAtPrice);
  const proof =
    socialProof ??
    (product.reviewCount >= 100
      ? `${product.reviewCount}+ happy customers`
      : `${product.reviewCount} verified reviews`);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-card shadow-sm ring-1 ring-border/70 card-soft",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden product-plate sm:aspect-square"
      >
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover img-zoom"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.badges?.slice(0, 2).map((badge) => (
            <Badge
              key={badge}
              variant={
                badge === "sale" ? "sale" : badge === "new" ? "new" : "soft"
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
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
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

          <h3 className="text-[15px] font-medium leading-snug tracking-tight text-foreground">
            <Link
              href={`/product/${product.slug}`}
              className="transition-colors hover:text-brand-deep"
            >
              {product.name}
            </Link>
          </h3>

          {/* Benefit-first line (outcome > feature) */}
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>
        </div>

        <div className="flex items-end justify-between gap-2">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
          />
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-[11px] font-semibold text-cta">
              Save {formatMoney(product.compareAtPrice - product.price)}
            </span>
          ) : null}
        </div>

        {/* Single dominant action — fewer decisions = more clicks */}
        <div className="mt-auto space-y-2 pt-1">
          <Button asChild variant="default" size="sm" className="pressable w-full">
            <Link href={`/cart?add=${product.slug}`}>Add to cart</Link>
          </Button>
          <Link
            href={`/product/${product.slug}`}
            className="block text-center text-xs font-medium text-brand-deep transition-colors hover:text-foreground"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
