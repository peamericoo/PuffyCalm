import { ViewTransition } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductDeepDive } from "@/components/product/product-deep-dive";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductSpecs } from "@/components/product/product-specs";
import { RelatedProducts } from "@/components/product/related-products";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";
import { getProductSpecs } from "@/types/product";

interface ProductDetailProps {
  product: Product;
  related?: Product[];
}

/**
 * PDP info column:
 * Mobile → price + CTA first, dense specs, short blurb (conversion-first).
 * Desktop → editorial Seoul Bird flow (details then buy).
 * Enter motion via View Transitions + CSS stagger (no animation libraries).
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

  const catSlug =
    product.categorySlugs.find((s) => s !== "all") ?? "all";

  return (
    <ViewTransition
      enter={{
        "nav-forward": "pdp-shell",
        "nav-back": "pdp-shell",
        default: "pdp-shell",
      }}
      default="none"
    >
      <div className="bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-[var(--shell-gutter)] pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-7 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground sm:mb-8 sm:text-[13px]"
          >
            <Link
              href="/"
              transitionTypes={["nav-back"]}
              className="transition hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <Link
              href={`/category/${catSlug}`}
              transitionTypes={["nav-back"]}
              className="transition hover:text-foreground"
            >
              {product.categoryLabel ?? "Shop"}
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="truncate text-foreground/75">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 items-start gap-5 sm:gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="order-1 min-w-0 lg:order-2">
              <ProductGallery
                productId={product.id}
                images={product.images}
                imageUrl={product.imageUrl}
                alt={product.imageAlt}
                priority
              />
            </div>

            <ViewTransition enter="pdp-copy" default="none">
              <div className="pdp-stagger order-2 flex min-w-0 flex-col lg:order-1 lg:pt-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                  {product.categoryLabel ?? "PuffyEasy"}
                </p>

                <h1 className="mt-1.5 font-display text-[1.65rem] font-medium leading-[1.1] tracking-tight text-foreground sm:mt-2 sm:text-[2.5rem] lg:text-[2.75rem]">
                  {product.name}
                </h1>

                <p className="mt-1 hidden font-mono text-[12px] tracking-wide text-muted-foreground/75 sm:mt-2 sm:block">
                  {sku}
                </p>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 sm:mt-5 sm:gap-x-3">
                  <span className="text-[1.5rem] font-semibold tracking-tight text-foreground sm:text-[2.1rem]">
                    {formatMoney(product.price, product.currency)}
                  </span>
                  {promo ? (
                    <>
                      <span className="text-[13px] text-muted-foreground line-through sm:text-[15px]">
                        {formatMoney(promo, product.currency)}
                      </span>
                      {off ? (
                        <span className="text-[11px] font-semibold text-brand-deep sm:text-[12px]">
                          −{off}%
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <p className="mt-1.5 text-[12px] text-muted-foreground sm:mt-2 sm:text-[13px]">
                  <a
                    href="#reviews"
                    className="transition-colors hover:text-foreground"
                  >
                    <span className="font-medium text-foreground">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="mx-1 text-border">·</span>
                    {product.reviewCount} reviews
                  </a>
                  <span className="mx-1 text-border">·</span>
                  {product.inStock ? (
                    <span className="text-success">In stock</span>
                  ) : (
                    <span className="text-cta">Out of stock</span>
                  )}
                </p>

                <div className="mt-4 lg:hidden">
                  <ProductBuyBox
                    slug={product.slug}
                    price={product.price}
                    currency={product.currency}
                    inStock={product.inStock}
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Free shipping $75+ · Easy returns
                  </p>
                </div>

                <p className="mt-4 max-w-md text-[13.5px] leading-snug text-muted-foreground sm:mt-6 sm:text-[15px] sm:leading-relaxed">
                  {blurb}
                </p>

                <ProductSpecs specs={specs} className="mt-4 sm:mt-8" />

                <div className="mt-10 hidden lg:block">
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
            </ViewTransition>
          </div>

          <div className="pdp-later">
            <ProductDeepDive product={product} />
          </div>

          <div className="pdp-later">
            <RelatedProducts products={related} />
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
