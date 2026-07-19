import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";
import { getProductSpecs } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductDetailProps {
  product: Product;
  related?: Product[];
}

/**
 * Minimal PDP — quiet commerce layout (minim-inspired):
 * info + buy left, large gallery right on desktop; gallery first on mobile.
 * Sky-calm brand, black CTA for restraint (coral reserved for home promos).
 */
export function ProductDetail({ product, related = [] }: ProductDetailProps) {
  const specs = getProductSpecs(product);
  const sku = product.id.replace(/^prod_/, "").toUpperCase().padStart(8, "0");
  const promo =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;
  const off = promo
    ? Math.round(((promo - product.price) / promo) * 100)
    : null;

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1180px] px-[var(--shell-gutter)] pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8 lg:px-10">
        {/* Breadcrumb — quiet */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground sm:mb-8 sm:text-[13px]"
        >
          <Link href="/" className="transition hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />
          <Link
            href={`/category/${product.categorySlugs.find((s) => s !== "all") ?? "all"}`}
            className="transition hover:text-foreground"
          >
            {product.categoryLabel ?? "Shop"}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-50" aria-hidden />
          <span className="truncate text-foreground/80">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          {/* Gallery — first on mobile */}
          <div className="order-1 min-w-0 lg:order-2">
            <ProductGallery
              images={product.images}
              imageUrl={product.imageUrl}
              alt={product.imageAlt}
              priority
            />
          </div>

          {/* Info column */}
          <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {product.categoryLabel ?? "PuffyEasy"}
            </p>

            <h1 className="mt-2 font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.65rem] lg:text-[2.85rem]">
              {product.name}
            </h1>

            <p className="mt-2 font-mono text-[12px] tracking-wide text-muted-foreground/80">
              {sku}
            </p>

            <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
                {formatMoney(product.price, product.currency)}
              </span>
              {promo ? (
                <>
                  <span className="pb-1 text-[15px] text-muted-foreground line-through">
                    {formatMoney(promo, product.currency)}
                  </span>
                  {off ? (
                    <span className="mb-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] font-semibold text-brand-deep">
                      −{off}%
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">
                {product.rating}
              </span>
              <span className="text-border">·</span>
              <span>{product.reviewCount} reviews</span>
              {!product.inStock ? (
                <>
                  <span className="text-border">·</span>
                  <span className="font-medium text-cta">Out of stock</span>
                </>
              ) : (
                <>
                  <span className="text-border">·</span>
                  <span className="text-success">In stock</span>
                </>
              )}
            </div>

            <p className="mt-6 max-w-md text-[14.5px] leading-[1.7] text-muted-foreground sm:text-[15px]">
              {product.description}
            </p>

            {/* Specs — minim-style label / value rows */}
            {specs.length > 0 ? (
              <dl className="mt-8 space-y-0 border-t border-border/60">
                {specs.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-1 gap-1 border-b border-border/60 py-3.5 sm:grid-cols-[7.5rem_1fr] sm:gap-6 sm:py-4"
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="text-[13.5px] leading-snug text-foreground/90 sm:text-[14px]">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-8 sm:mt-10">
              <ProductBuyBox
                slug={product.slug}
                price={product.price}
                currency={product.currency}
                inStock={product.inStock}
              />
              <p className="mt-3 text-[12px] text-muted-foreground">
                Free tracked shipping on orders $75+ · Guest checkout
              </p>
            </div>
          </div>
        </div>

        {/* Related — quiet strip */}
        {related.length > 0 ? (
          <section className="mt-16 border-t border-border/50 pt-12 sm:mt-20 sm:pt-14">
            <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Also consider
                </p>
                <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                  You may also like
                </h2>
              </div>
              <Link
                href="/category/all"
                className="shrink-0 text-[13px] font-medium text-muted-foreground transition hover:text-brand-deep"
              >
                View all
              </Link>
            </div>
            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:gap-4",
                related.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
              )}
            >
              {related.map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
