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
import { DisplayStack } from "@/components/shared/section-heading";
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
        "glass-panel relative overflow-hidden rounded-[1.5rem] p-4 xl:p-5",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-brand/30 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-brand-deep/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mb-4 px-0.5">
        <DisplayStack
          eyebrow="Browse"
          title="Shop by mood"
          description="Jump straight into what you need."
          size="sm"
          accent="mood"
          aura
          noReveal
          className="display-stack--compact"
        />
      </div>

      <nav
        className="relative flex flex-col gap-2"
        aria-label="Shop categories"
      >
        {shopCategories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className={cn(
                "group/cat flex items-center gap-3 rounded-2xl p-2 pr-3 transition-all duration-300",
                "hover:bg-white/65 hover:shadow-[0_10px_28px_-16px_rgb(26_35_50/0.28)]",
                "active:scale-[0.99]",
                i === 0 && "bg-white/50 ring-1 ring-white/70",
              )}
            >
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/80">
                <Image
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover transition-transform duration-500 group-hover/cat:scale-110"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-brand-deep/40 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Icon
                    className="h-4 w-4 text-white drop-shadow-sm"
                    strokeWidth={2.25}
                  />
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-semibold text-foreground">
                    {cat.label}
                  </span>
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {cat.count}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                  {cat.tagline}
                </span>
              </span>

              <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-deep/45 transition-all duration-300 group-hover/cat:translate-x-0.5 group-hover/cat:-translate-y-0.5 group-hover/cat:text-brand-deep" />
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-4 border-t border-white/45 pt-4">
        <Link
          href="/category/all"
          className="pressable glass-btn-cta flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-white"
        >
          Shop the collection
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
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
      <div className="mb-2.5 flex items-center justify-between gap-3 px-0.5">
        <DisplayStack
          eyebrow="Browse"
          title="Shop by mood"
          size="sm"
          accent="mood"
          aura={false}
          noReveal
          className="display-stack--compact min-w-0"
        />
        <Link
          href="/category/all"
          className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 no-scrollbar">
        {shopCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="group/mcat relative flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/70">
                <Image
                  src={cat.imageUrl}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-brand-deep/45 to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.25} />
                </span>
              </span>
              <span className="w-full truncate text-center text-[12px] font-medium text-foreground">
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
 * Background comes from page-level continuous shop-stage wrapper.
 */
export function ShopNow() {
  const catalog = getConversionCatalog();

  return (
    <section className="relative overflow-x-clip px-[var(--shell-gutter)] pb-10 pt-2 sm:px-5 sm:pb-14 sm:pt-4">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 sm:mb-8">
          <DisplayStack
            eyebrow="Shop"
            title="What customers buy first"
            description="Curated picks · free shipping over $75"
            accent="first"
            motion="rise"
            className="max-w-xl"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
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
                <div className="glass-panel rounded-[1.25rem] px-3 py-3.5">
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
