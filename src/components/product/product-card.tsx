import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { Price } from "@/components/product/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-card card-soft",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden product-plate"
      >
        <Image
          src={product.imageUrl}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {product.badges?.length ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((badge) => (
              <Badge
                key={badge}
                variant={
                  badge === "sale" ? "sale" : badge === "new" ? "new" : "soft"
                }
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
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-1.5">
          {product.categoryLabel ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {product.categoryLabel}
            </p>
          ) : null}
          <h3 className="text-[15px] font-medium leading-snug tracking-tight text-foreground">
            <Link
              href={`/product/${product.slug}`}
              className="transition-colors hover:text-accent"
            >
              {product.name}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>
        </div>

        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          currency={product.currency}
        />

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/cart?add=${product.slug}`}>Add to Cart</Link>
          </Button>
          <Button asChild variant="dark" size="sm" className="w-full">
            <Link href={`/product/${product.slug}`}>Buy Now</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
