import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock/products";
import { formatMoney } from "@/lib/format";

/**
 * Sort for conversion:
 * 1) On sale (price anchoring)
 * 2) Bestsellers (social proof)
 * 3) Highest rated
 * Hick's law: show a short curated set, not the whole catalog.
 */
function getConversionCatalog() {
  return [...products]
    .sort((a, b) => {
      const saleA = a.compareAtPrice ? 1 : 0;
      const saleB = b.compareAtPrice ? 1 : 0;
      if (saleB !== saleA) return saleB - saleA;
      const bestA = a.badges?.includes("bestseller") ? 1 : 0;
      const bestB = b.badges?.includes("bestseller") ? 1 : 0;
      if (bestB !== bestA) return bestB - bestA;
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    })
    .slice(0, 7);
}

const filters = [
  { label: "Bestsellers", href: "/category/all", active: true },
  { label: "Recovery", href: "/category/recovery" },
  { label: "Comfort", href: "/category/comfort" },
  { label: "Under $50", href: "/category/all" },
] as const;

/**
 * Post-hero shop section — applied conversion science:
 * - Social proof (ratings, “customers chose”)
 * - Scarcity/urgency that’s honest (launch window)
 * - Price anchoring (compare-at + save amount)
 * - Limited choice set (Hick’s law)
 * - Trust near money (shipping / guest checkout)
 * - One primary CTA path (coral)
 */
export function ShopNow() {
  const catalog = getConversionCatalog();
  const heroProduct = catalog[0];
  const grid = catalog.slice(1, 7);
  const totalReviews = products.reduce((s, p) => s + p.reviewCount, 0);

  return (
    <section className="shop-stage relative border-y border-border/80 px-3 py-11 sm:px-5 sm:py-16">
      <div className="mx-auto max-w-[1440px]">
        {/* Urgency strip — temporal motivation (Cialdini: scarcity + commitment) */}
        <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-cta/20 bg-white px-4 py-3 shadow-sm sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-5 animate-fade-up">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cta text-white">
              <Clock3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Launch pricing is live this week
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                Real limited-time launch offer — not fake stock. Prices return
                to regular after the window ends.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground sm:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-border">
              <Users className="h-3.5 w-3.5 text-brand-deep" />
              {totalReviews.toLocaleString()}+ reviews storewide
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-border">
              <Truck className="h-3.5 w-3.5 text-brand-deep" />
              Free shipping $75+
            </span>
          </div>
        </div>

        {/* Section header — outcome language, not catalog language */}
        <div className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl animate-fade-up">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-deep">
              Shop bestsellers
            </p>
            <h2 className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
              What customers buy first
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              A short list of high-intent picks — sorted by demand, ratings, and
              launch savings. Less scrolling. Clearer choices.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 animate-fade-up delay-1">
            {filters.map((filter) => (
              <Link
                key={filter.label}
                href={filter.href}
                className={
                  "active" in filter && filter.active
                    ? "pressable rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
                    : "pressable rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-brand hover:bg-brand-soft hover:text-brand-deep"
                }
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Featured + grid on elevated white panel for contrast */}
        <div className="shop-panel rounded-[1.6rem] p-3 sm:p-4 lg:p-5">
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          {heroProduct ? (
            <article className="group relative overflow-hidden rounded-[1.35rem] bg-card shadow-sm ring-1 ring-border/80 lg:col-span-5 card-soft animate-fade-up">
              <Link
                href={`/product/${heroProduct.slug}`}
                className="relative block aspect-[4/5] overflow-hidden product-plate sm:aspect-[5/4] lg:min-h-[400px] lg:aspect-auto"
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
                    #1 most popular
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">
                      {heroProduct.rating}
                    </span>
                    <span>({heroProduct.reviewCount} reviews)</span>
                  </span>
                  <span className="text-border">·</span>
                  <span className="text-success font-medium">In stock</span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                    Customers’ first pick
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

                {/* Anchoring: big sale price + struck regular */}
                <div className="rounded-2xl bg-brand-soft/80 px-4 py-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-brand-deep">
                      {formatMoney(heroProduct.price, heroProduct.currency)}
                    </span>
                    {heroProduct.compareAtPrice ? (
                      <>
                        <span className="pb-1 text-sm text-muted-foreground line-through">
                          {formatMoney(
                            heroProduct.compareAtPrice,
                            heroProduct.currency,
                          )}
                        </span>
                        <span className="pb-1 text-sm font-semibold text-cta">
                          You save{" "}
                          {formatMoney(
                            heroProduct.compareAtPrice - heroProduct.price,
                          )}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Launch price · free tracked shipping over $75
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    asChild
                    variant="default"
                    size="lg"
                    className="pressable w-full"
                  >
                    <Link href={`/cart?add=${heroProduct.slug}`}>
                      Add to cart — {formatMoney(heroProduct.price)}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="pressable w-full"
                  >
                    <Link href={`/product/${heroProduct.slug}`}>
                      View full details
                    </Link>
                  </Button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                    Guest checkout · Secure payment · No account required
                  </p>
                </div>
              </div>
            </article>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-7 xl:grid-cols-3">
            {grid.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                socialProof={
                  i < 2
                    ? "Often bought together with recovery kits"
                    : undefined
                }
              />
            ))}
          </div>
        </div>
        </div>

        {/* Bottom conversion band */}
        <div className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 animate-fade-up">
          <div className="rounded-2xl border border-border/80 bg-white/90 px-4 py-4 text-center shadow-sm backdrop-blur-sm sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-deep">
              Social proof
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Average product rating{" "}
              <span className="font-semibold text-foreground">4.7★</span> across
              the catalog.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-white/90 px-4 py-4 text-center shadow-sm backdrop-blur-sm sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-deep">
              Low friction
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Guest checkout is on by default — buy without creating an account.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-foreground px-4 py-4 text-white shadow-sm sm:flex-row sm:items-center sm:col-span-1">
            <div>
              <p className="font-display text-lg font-medium">See everything</p>
              <p className="text-xs text-white/65">
                {products.length} curated products
              </p>
            </div>
            <Button asChild variant="default" size="sm" className="pressable shrink-0">
              <Link href="/category/all">
                Shop all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
