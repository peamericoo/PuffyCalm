import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { Reveal } from "@/components/shared/reveal";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/types/product";
import { getProductSpecs } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductDetailProps {
  product: Product;
  related?: Product[];
}

/**
 * Full-bleed minimal PDP — Seoul Bird structure:
 * left editorial info + right square gallery.
 * Sharp corners, sparse copy, oversized ATC, light motion.
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

  /* Prefer short line — fall back to first sentence of description */
  const blurb =
    product.shortDescription?.trim() ||
    product.description.split(/(?<=\.)\s/)[0] ||
    product.description;

  return (
    <div className="bg-white">
      {/* Wider canvas — occupy the viewport */}
      <div className="mx-auto w-full max-w-[1440px] px-[var(--shell-gutter)] pb-20 pt-5 sm:px-8 sm:pb-24 sm:pt-7 lg:px-10 xl:px-14">
        {/* Breadcrumb — almost invisible chrome */}
        <Reveal variant="fade" delay={0}>
          <nav
            aria-label="Breadcrumb"
            className="mb-7 flex flex-wrap items-center gap-1 text-[12px] text-muted-foreground/80 sm:mb-10 sm:text-[13px]"
          >
            <Link
              href="/"
              className="transition-colors duration-200 hover:text-foreground"
            >
              Home
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <Link
              href={`/category/${product.categorySlugs.find((s) => s !== "all") ?? "all"}`}
              className="transition-colors duration-200 hover:text-foreground"
            >
              {product.categoryLabel ?? "Shop"}
            </Link>
            <ChevronRight className="h-3 w-3 opacity-40" aria-hidden />
            <span className="truncate text-foreground/70">{product.name}</span>
          </nav>
        </Reveal>

        {/* Main product stage */}
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 xl:gap-16">
          {/* Gallery first on mobile, right on desktop */}
          <Reveal
            variant="scale"
            delay={60}
            className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-[calc(var(--nav-h)+1.25rem)]"
          >
            <ProductGallery
              images={product.images}
              imageUrl={product.imageUrl}
              alt={product.imageAlt}
              priority
            />
          </Reveal>

          {/* Info column */}
          <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:pt-1">
            <Reveal variant="slide" delay={40}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {product.categoryLabel ?? "PuffyEasy"}
              </p>
            </Reveal>

            <Reveal variant="scale" delay={90}>
              <h1 className="mt-2.5 font-display text-[2.35rem] font-medium leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[3rem] lg:text-[3.25rem] xl:text-[3.5rem]">
                {product.name}
              </h1>
            </Reveal>

            <Reveal variant="fade" delay={130}>
              <p className="mt-2.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground/70 sm:text-[12px]">
                {sku}
              </p>
            </Reveal>

            <Reveal variant="rise" delay={160}>
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.35rem]">
                  {formatMoney(product.price, product.currency)}
                </span>
                {promo ? (
                  <>
                    <span className="text-[15px] text-muted-foreground/80 line-through">
                      {formatMoney(promo, product.currency)}
                    </span>
                    {off ? (
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-brand-deep">
                        −{off}%
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>
            </Reveal>

            {/* One tight line of trust — no review chrome clutter */}
            <Reveal variant="fade" delay={190}>
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
            </Reveal>

            {/* Short blurb — one breath of copy */}
            <Reveal variant="soft" delay={220}>
              <p className="mt-7 max-w-[28rem] text-[15px] leading-[1.65] text-muted-foreground sm:text-[15.5px]">
                {blurb}
              </p>
            </Reveal>

            {/* Specs — label / value, no heavy rules */}
            {specs.length > 0 ? (
              <dl className="mt-9 space-y-0 sm:mt-10">
                {specs.map((row, i) => (
                  <Reveal key={row.label} variant="slide" delay={250 + i * 55}>
                    <div
                      className={cn(
                        "grid grid-cols-1 gap-0.5 py-3.5 sm:grid-cols-[6.5rem_1fr] sm:items-baseline sm:gap-8 sm:py-4",
                        i === 0 && "border-t border-foreground/[0.08]",
                        "border-b border-foreground/[0.08]",
                      )}
                    >
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {row.label}
                      </dt>
                      <dd className="text-[13.5px] leading-snug text-foreground/85 sm:text-[14px]">
                        {row.value}
                      </dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
            ) : null}

            {/* Buy row — the hero of the page */}
            <Reveal variant="rise" delay={480}>
              <div className="mt-9 sm:mt-11">
                <ProductBuyBox
                  slug={product.slug}
                  price={product.price}
                  currency={product.currency}
                  inStock={product.inStock}
                />
                <p className="mt-3.5 text-[12px] tracking-wide text-muted-foreground/80">
                  Free shipping $75+ · Easy returns
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Related — quiet, square cards feel */}
        {related.length > 0 ? (
          <section className="mt-20 border-t border-foreground/[0.08] pt-14 sm:mt-28 sm:pt-16">
            <Reveal variant="soft">
              <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Next up
                  </p>
                  <h2 className="mt-1.5 font-display text-[1.5rem] font-medium tracking-tight text-foreground sm:text-[1.85rem]">
                    You may also like
                  </h2>
                </div>
                <Link
                  href="/category/all"
                  className="shrink-0 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  View all
                </Link>
              </div>
            </Reveal>
            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:gap-4",
                related.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
              )}
            >
              {related.map((p, i) => (
                <Reveal key={p.id} variant="rise" delay={80 + i * 70}>
                  <ProductCard product={p} compact />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
