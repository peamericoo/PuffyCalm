import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, Truck, ShieldCheck, Zap } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock/products";
import { formatMoney } from "@/lib/format";

const quickFilters = [
  { label: "All", href: "/category/all" },
  { label: "Recovery", href: "/category/recovery" },
  { label: "Comfort", href: "/category/comfort" },
  { label: "Everyday", href: "/category/everyday" },
  { label: "On sale", href: "/category/all" },
] as const;

const trust = [
  { icon: Truck, label: "Free shipping $75+" },
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Zap, label: "Launch prices this week" },
] as const;

/**
 * Immediate store contact after hero — product-first, conversion-focused.
 * Replaces the old Spotlight/category bento.
 */
export function ShopNow() {
  const catalog = products.slice(0, 8);
  const heroProduct = catalog[0];
  const grid = catalog.slice(1, 7);

  return (
    <section className="border-b border-border/80 bg-background px-3 py-10 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-[1440px]">
        {/* Header + commercial context */}
        <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl animate-fade-up">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-deep">
              Shop now · Launch sale
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
              Ready to upgrade your day?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Browse bestsellers and launch offers — recovery, comfort, and
              everyday essentials from{" "}
              <span className="font-semibold text-foreground">$39</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 animate-fade-up delay-1">
            {trust.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <Icon className="h-3.5 w-3.5 text-brand-deep" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Quick category chips — jump into the store */}
        <div className="mb-7 flex gap-2 overflow-x-auto no-scrollbar pb-1 animate-fade-up delay-1">
          {quickFilters.map((filter, i) => (
            <Link
              key={filter.label}
              href={filter.href}
              className={
                i === 0
                  ? "pressable shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
                  : "pressable shrink-0 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-deep"
              }
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {/* Conversion layout: featured product + product grid */}
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Featured buy card — large, commercial */}
          {heroProduct ? (
            <article className="group relative overflow-hidden rounded-[1.5rem] bg-card shadow-sm ring-1 ring-border/80 lg:col-span-5 card-soft animate-fade-up">
              <Link
                href={`/product/${heroProduct.slug}`}
                className="relative block aspect-[4/5] overflow-hidden product-plate sm:aspect-[5/4] lg:aspect-auto lg:h-[min(100%,520px)] lg:min-h-[420px]"
              >
                <Image
                  src={heroProduct.imageUrl}
                  alt={heroProduct.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover img-zoom"
                  priority
                />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-cta px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Bestseller
                  </span>
                  {heroProduct.compareAtPrice ? (
                    <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-cta">
                      Save{" "}
                      {formatMoney(
                        heroProduct.compareAtPrice - heroProduct.price,
                      )}
                    </span>
                  ) : null}
                </div>
              </Link>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">
                    {heroProduct.rating}
                  </span>
                  <span>({heroProduct.reviewCount} reviews)</span>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                    {heroProduct.categoryLabel}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground">
                    <Link
                      href={`/product/${heroProduct.slug}`}
                      className="hover:text-brand-deep"
                    >
                      {heroProduct.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {heroProduct.shortDescription}
                  </p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tracking-tight text-brand-deep">
                    {formatMoney(heroProduct.price, heroProduct.currency)}
                  </span>
                  {heroProduct.compareAtPrice ? (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatMoney(
                        heroProduct.compareAtPrice,
                        heroProduct.currency,
                      )}
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild variant="outline" size="lg" className="pressable">
                    <Link href={`/cart?add=${heroProduct.slug}`}>
                      Add to cart
                    </Link>
                  </Button>
                  <Button asChild variant="default" size="lg" className="pressable">
                    <Link href={`/product/${heroProduct.slug}`}>Buy now</Link>
                  </Button>
                </div>
              </div>
            </article>
          ) : null}

          {/* Product grid — immediate catalog contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-7 xl:grid-cols-3">
            {grid.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Footer CTA into full store */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.35rem] border border-border bg-brand-soft/60 px-5 py-5 sm:mt-10 sm:flex-row sm:px-7 animate-fade-up">
          <div>
            <p className="font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              See the full collection
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length} curated products · Guest checkout available
            </p>
          </div>
          <Button asChild variant="default" size="lg" className="pressable w-full sm:w-auto">
            <Link href="/category/all">
              Shop all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
