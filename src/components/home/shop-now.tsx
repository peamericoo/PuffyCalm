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

function CategoryRail({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "glass-panel relative overflow-hidden rounded-[1.35rem] p-3 sm:p-3.5",
        className,
      )}
    >
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

      <nav
        className="relative flex flex-col gap-1.5"
        aria-label="Shop categories"
      >
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
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-white/70">
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
  );
}

/** Mobile-only compact horizontal mood scroller — doesn't steal first contact */
function MobileMoodStrip() {
  return (
    <div className="lg:hidden">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          Shop by mood
        </p>
        <Link
          href="/category/all"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
        {shopCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="group/mcat relative flex w-[4.75rem] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/70">
                <Image
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-brand-deep/45 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.25} />
                </span>
              </span>
              <span className="w-full truncate text-center text-[11px] font-medium text-foreground">
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Premium shop stage:
 * Desktop — glass category rail left + product grid.
 * Mobile  — products first, compact mood strip after (no tall rail).
 */
export function ShopNow() {
  const catalog = getConversionCatalog();

  return (
    <section className="shop-stage relative border-y border-border/80 px-3 py-9 sm:px-5 sm:py-14">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          {/* Desktop rail only */}
          <Reveal
            delay={60}
            className="hidden lg:sticky lg:top-[calc(var(--promo-h)+5.5rem)] lg:block lg:self-start"
          >
            <CategoryRail />
          </Reveal>

          {/* Products — first contact after title on mobile */}
          <div className="min-w-0 order-1 lg:order-none">
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3">
              {catalog.map((product, i) => (
                <Reveal
                  key={product.id}
                  delay={60 + i * 35}
                  className="h-full min-h-0"
                >
                  <ProductCard product={product} compact />
                </Reveal>
              ))}
            </div>

            {/* Mobile mood strip after products */}
            <div className="mt-6 lg:hidden">
              <Reveal delay={120}>
                <div className="glass-panel rounded-[1.25rem] px-3 py-3">
                  <MobileMoodStrip />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
