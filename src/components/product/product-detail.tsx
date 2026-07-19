import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductGallery } from "@/components/product/product-gallery";
import { RelatedProducts } from "@/components/product/related-products";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";
import { getProductSpecs } from "@/types/product";

interface ProductDetailProps {
  product: Product;
  related?: Product[];
}

/**
 * Clean minimal PDP — info left, gallery right, no visual gimmicks.
 */
export function ProductDetail({ product, related = [] }: ProductDetailProps) {
  const specs = getProductSpecs(product).slice(0, 4);
  const sku = product.id.replace(/^prod_/, "").toUpperCase().padStart(8, "0");
  const promo =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : null;
  const off = promo
    ? Math.round(((promo - product.price) / promo) * 100)
    : null;

  const blurb =
    product.shortDescription?.trim() ||
    product.description.split(/(?<=\.)\s/)[0] ||
    product.description;

  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-[var(--shell-gutter)] pb-16 pt-5 sm:px-8 sm:pb-20 sm:pt-7 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground sm:mb-8 sm:text-[13px]"
        >
          <Link href="/" className="transition hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          <Link
            href={`/category/${product.categorySlugs.find((s) => s !== "all") ?? "all"}`}
            className="transition hover:text-foreground"
          >
            {product.categoryLabel ?? "Shop"}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
          <span className="truncate text-foreground/75">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Gallery — first on mobile, right on desktop */}
          <div className="order-1 min-w-0 lg:order-2">
            <ProductGallery
              images={product.images}
              imageUrl={product.imageUrl}
              alt={product.imageAlt}
              priority
            />
          </div>

          {/* Info */}
          <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {product.categoryLabel ?? "PuffyEasy"}
            </p>

            <h1 className="mt-2 font-display text-[2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.5rem] lg:text-[2.75rem]">
              {product.name}
            </h1>

            <p className="mt-2 font-mono text-[11px] tracking-wide text-muted-foreground/75 sm:text-[12px]">
              {sku}
            </p>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[1.85rem] font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                {formatMoney(product.price, product.currency)}
              </span>
              {promo ? (
                <>
                  <span className="text-[15px] text-muted-foreground line-through">
                    {formatMoney(promo, product.currency)}
                  </span>
                  {off ? (
                    <span className="text-[12px] font-semibold text-brand-deep">
                      −{off}%
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>

            <p className="mt-2 text-[13px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {product.rating.toFixed(1)}
              </span>
              <span className="mx-1.5 text-border">·</span>
              {product.reviewCount} reviews
              <span className="mx-1.5 text-border">·</span>
              {product.inStock ? (
                <span className="text-success">In stock</span>
              ) : (
                <span className="text-cta">Out of stock</span>
              )}
            </p>

            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              {blurb}
            </p>

            {specs.length > 0 ? (
              <dl className="mt-8 border-t border-border/70">
                {specs.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-1 gap-0.5 border-b border-border/70 py-3.5 sm:grid-cols-[6.5rem_1fr] sm:gap-6"
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="text-[14px] leading-snug text-foreground/90">
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
                Free shipping $75+ · Easy returns
              </p>
            </div>
          </div>
        </div>

        <RelatedProducts products={related} />
      </div>
    </div>
  );
}
