import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/types/product";
import { Price } from "@/components/product/price";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

function badgeVariant(badge: NonNullable<Product["badges"]>[number]) {
  if (badge === "sale") return "sale" as const;
  if (badge === "new") return "new" as const;
  if (badge === "bestseller") return "brand" as const;
  return "soft" as const;
}

function badgeLabel(badge: NonNullable<Product["badges"]>[number]) {
  if (badge === "bestseller") return "Bestseller";
  if (badge === "new") return "New";
  if (badge === "limited") return "Limited";
  return "Sale";
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card card-lift",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden"
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-[1.03]",
            product.imageGradient,
          )}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-6xl opacity-90 drop-shadow-sm transition-transform duration-500 group-hover:scale-110 sm:text-7xl"
            aria-hidden
          >
            {product.imageEmoji}
          </span>
        </div>

        {product.badges?.length ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((badge) => (
              <Badge key={badge} variant={badgeVariant(badge)}>
                {badgeLabel(badge)}
              </Badge>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm backdrop-blur transition-all hover:text-rose-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span>({product.reviewCount})</span>
          </div>
          <h3 className="font-medium leading-snug tracking-tight text-foreground">
            <Link
              href={`/product/${product.slug}`}
              className="transition-colors hover:text-brand-deep"
            >
              {product.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
          />
          <Link
            href={`/product/${product.slug}`}
            className="rounded-full bg-foreground px-3.5 py-2 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
