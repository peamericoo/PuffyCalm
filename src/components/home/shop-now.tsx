import Link from "next/link";
import { Star } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductImageCarousel } from "@/components/product/product-image-carousel";
import { Reveal } from "@/components/shared/reveal";
import { products } from "@/lib/mock/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Conversion sort: sale first, then rating + volume.
 * (No bestseller badges in UI — still rank by quality signals.)
 */
function getConversionCatalog() {
  return [...products]
    .sort((a, b) => {
      const saleA = a.compareAtPrice ? 1 : 0;
      const saleB = b.compareAtPrice ? 1 : 0;
      if (saleB !== saleA) return saleB - saleA;
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    })
    .slice(0, 7);
}

const filters = [
  { label: "Popular", href: "/category/all", active: true },
  { label: "Recovery", href: "/category/recovery" },
  { label: "Comfort", href: "/category/comfort" },
  { label: "Under $50", href: "/category/all" },
] as const;

/**
 * Floating product cards — no outer panel.
 * Coordinated slow image carousels across the grid.
 */
export function ShopNow() {
  const catalog = getConversionCatalog();
  const heroProduct = catalog[0];
  const grid = catalog.slice(1, 7);
  const heroPromo = Boolean(
    heroProduct?.compareAtPrice &&
      heroProduct.compareAtPrice > heroProduct.price,
  );
  const heroOff =
    heroProduct?.compareAtPrice &&
    heroProduct.compareAtPrice > heroProduct.price
      ? Math.round(
          ((heroProduct.compareAtPrice - heroProduct.price) /
            heroProduct.compareAtPrice) *
            100,
        )
      : null;

  return (
    <section className="shop-stage relative border-y border-border/80 px-3 py-10 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-7 flex flex-col gap-4 lg:mb-9 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-deep">
              Shop
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              What customers buy first
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Curated picks — free shipping over $75.
            </p>
          </Reveal>

          <Reveal delay={120} className="flex flex-wrap gap-1.5">
            {filters.map((filter) => (
              <Link
                key={filter.label}
                href={filter.href}
                className={
                  "active" in filter && filter.active
                    ? "pressable rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-white"
                    : "pressable rounded-full border border-border/80 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-brand hover:bg-brand-soft hover:text-brand-deep"
                }
              >
                {filter.label}
              </Link>
            ))}
          </Reveal>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
          {heroProduct ? (
            <Reveal
              as="div"
              className="lg:col-span-5"
              delay={80}
            >
              <article className="group/card product-card relative overflow-hidden rounded-2xl bg-card">
                <span
                  className="product-card-glow pointer-events-none absolute inset-0 z-0"
                  aria-hidden
                />
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="relative z-[1] block aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:min-h-[360px] lg:aspect-auto"
                >
                  <ProductImageCarousel
                    images={heroProduct.images}
                    imageUrl={heroProduct.imageUrl}
                    alt={heroProduct.imageAlt}
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="absolute inset-0"
                  />
                  {heroOff ? (
                    <span className="absolute left-3 top-3 z-[3] rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                      −{heroOff}%
                    </span>
                  ) : null}
                </Link>

                <div className="relative z-[1] space-y-3 p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 transition-transform duration-700 group-hover/card:animate-star-spin" />
                    <span className="font-semibold text-foreground">
                      {heroProduct.rating}
                    </span>
                    <span>({heroProduct.reviewCount})</span>
                    {heroProduct.inStock ? (
                      <>
                        <span className="text-border">·</span>
                        <span className="font-medium text-success">In stock</span>
                      </>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-medium tracking-tight text-foreground transition-colors duration-500 group-hover/card:text-brand-deep sm:text-2xl">
                      <Link href={`/product/${heroProduct.slug}`}>
                        {heroProduct.name}
                      </Link>
                    </h3>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground transition-all duration-500 group-hover/card:text-foreground/75">
                      {heroProduct.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <span
                      className={cn(
                        "text-2xl font-semibold tracking-tight",
                        heroPromo ? "text-success" : "text-brand-deep",
                      )}
                    >
                      {formatMoney(heroProduct.price, heroProduct.currency)}
                    </span>
                    {heroPromo && heroProduct.compareAtPrice ? (
                      <span className="pb-0.5 text-sm text-muted-foreground line-through">
                        {formatMoney(
                          heroProduct.compareAtPrice,
                          heroProduct.currency,
                        )}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/cart?add=${heroProduct.slug}`}
                      className={cn(
                        "pressable inline-flex h-10 flex-1 items-center justify-center rounded-full text-sm font-medium transition-all duration-500",
                        heroPromo
                          ? "bg-success text-white hover:bg-success/90"
                          : "bg-cta text-white hover:bg-cta-hover",
                      )}
                    >
                      Add to cart
                    </Link>
                    <Link
                      href={`/product/${heroProduct.slug}`}
                      className="pressable inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border bg-white text-sm font-medium text-foreground transition-colors hover:bg-brand-soft"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:col-span-7 xl:grid-cols-3">
            {grid.map((product, i) => (
              <Reveal key={product.id} delay={100 + i * 50} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
