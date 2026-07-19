import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Cloud,
  LayoutGrid,
  Sparkles,
  SunMedium,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/shared/reveal";
import { products } from "@/lib/mock/products";
import { cn } from "@/lib/utils";

/**
 * Conversion sort: sale first, then rating + volume.
 */
function getConversionCatalog() {
  return [...products]
    .sort((a, b) => {
      const saleA = a.compareAtPrice ? 1 : 0;
      const saleB = b.compareAtPrice ? 1 : 0;
      if (saleB !== saleA) return saleB - saleA;
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    })
    .slice(0, 6);
}

type ShopCategory = {
  label: string;
  href: string;
  tagline: string;
  icon: LucideIcon;
  imageUrl: string;
  count: string;
};

const shopCategories: ShopCategory[] = [
  {
    label: "Recovery",
    href: "/category/recovery",
    tagline: "Tension out",
    icon: Sparkles,
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80",
    count: "4",
  },
  {
    label: "Comfort",
    href: "/category/comfort",
    tagline: "Soft support",
    icon: Cloud,
    imageUrl:
      "https://images.unsplash.com/photo-1616628182501-df42145cf54d?auto=format&fit=crop&w=200&q=80",
    count: "3",
  },
  {
    label: "Everyday",
    href: "/category/everyday",
    tagline: "Small upgrades",
    icon: SunMedium,
    imageUrl:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=200&q=80",
    count: "2",
  },
  {
    label: "Under $50",
    href: "/category/all",
    tagline: "Easy picks",
    icon: Tag,
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=200&q=80",
    count: "5+",
  },
  {
    label: "All products",
    href: "/category/all",
    tagline: "Full edit",
    icon: LayoutGrid,
    imageUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=200&q=80",
    count: String(products.length),
  },
];

/**
 * Premium shop stage:
 * left glass category rail · right compact equal-height product grid.
 * No hero column that leaves empty space. No hover layout shift.
 */
export function ShopNow() {
  const catalog = getConversionCatalog();

  return (
    <section className="shop-stage relative border-y border-border/80 px-3 py-10 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <Reveal className="max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-deep">
              Shop
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight text-foreground sm:text-[2.35rem]">
              What customers buy first
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Curated picks · free shipping over $75
            </p>
          </Reveal>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          {/* ——— Left: glass category rail ——— */}
          <Reveal delay={60} className="lg:sticky lg:top-[calc(var(--promo-h)+5.5rem)] lg:self-start">
            <aside className="glass-panel relative overflow-hidden rounded-[1.35rem] p-3 sm:p-3.5">
              {/* Soft light orbs */}
              <span
                className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand/25 blur-3xl"
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-cta/10 blur-3xl"
                aria-hidden
              />

              <div className="relative mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-deep/80">
                    Browse
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    Shop by mood
                  </p>
                </div>
                <span className="glass-chip flex h-8 w-8 items-center justify-center rounded-full text-brand-deep">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </span>
              </div>

              <nav className="relative flex flex-col gap-1.5" aria-label="Shop categories">
                {shopCategories.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className={cn(
                        "group/cat flex items-center gap-2.5 rounded-2xl p-1.5 pr-2.5 transition-all duration-300",
                        "hover:bg-white/55 hover:shadow-[0_8px_24px_-16px_rgb(26_35_50/0.25)]",
                        "active:scale-[0.99]",
                        i === 0 && "bg-white/40 ring-1 ring-white/60",
                      )}
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/70 shadow-sm">
                        <Image
                          src={cat.imageUrl}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover transition-transform duration-500 group-hover/cat:scale-110"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-brand-deep/35 to-transparent" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Icon
                            className="h-3.5 w-3.5 text-white drop-shadow-sm"
                            strokeWidth={2.25}
                          />
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-medium text-foreground">
                            {cat.label}
                          </span>
                          <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                            {cat.count}
                          </span>
                        </span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {cat.tagline}
                        </span>
                      </span>

                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-brand-deep/40 transition-all duration-300 group-hover/cat:translate-x-0.5 group-hover/cat:-translate-y-0.5 group-hover/cat:text-cta" />
                    </Link>
                  );
                })}
              </nav>

              <div className="relative mt-3 border-t border-white/40 pt-3">
                <Link
                  href="/category/all"
                  className="pressable glass-btn-cta flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-sm font-medium text-white"
                >
                  Shop the collection
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Guest checkout · tracked shipping
                </p>
              </div>
            </aside>
          </Reveal>

          {/* ——— Right: compact equal product grid ——— */}
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
              {catalog.map((product, i) => (
                <Reveal
                  key={product.id}
                  delay={80 + i * 40}
                  className="h-full min-h-0"
                >
                  <ProductCard product={product} compact />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
