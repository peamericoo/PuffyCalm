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
import { getHomeProductRail, listCategories } from "@/lib/catalog/service";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

type ShopCategory = {
  label: string;
  href: string;
  tagline: string;
  icon: LucideIcon;
  imageUrl: string;
  count: string;
};

const MOOD_ICONS: Record<string, LucideIcon> = {
  recovery: Sparkles,
  comfort: Cloud,
  everyday: SunMedium,
};

const MOOD_TAGLINES: Record<string, string> = {
  recovery: "Tension out",
  comfort: "Soft support",
  everyday: "Small upgrades",
};

async function buildShopCategories(
  fallbackTotal: number,
): Promise<ShopCategory[]> {
  let recoveryCount = "4";
  let comfortCount = "3";
  let everydayCount = "2";
  let allCount = String(fallbackTotal || "—");
  let recoveryImg =
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=70";
  let comfortImg =
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=70";
  let everydayImg =
    "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=200&q=70";

  try {
    const cats = await listCategories();
    for (const c of cats) {
      if (c.slug === "recovery") {
        recoveryCount = String(c.productCount);
        if (c.imageUrl) recoveryImg = c.imageUrl;
      }
      if (c.slug === "comfort") {
        comfortCount = String(c.productCount);
        if (c.imageUrl) comfortImg = c.imageUrl;
      }
      if (c.slug === "everyday") {
        everydayCount = String(c.productCount);
        if (c.imageUrl) everydayImg = c.imageUrl;
      }
      if (c.slug === "all") {
        allCount = String(c.productCount);
      }
    }
  } catch {
    /* keep defaults */
  }

  return [
    {
      label: "Recovery",
      href: "/category/recovery",
      tagline: MOOD_TAGLINES.recovery,
      icon: MOOD_ICONS.recovery,
      imageUrl: recoveryImg,
      count: recoveryCount,
    },
    {
      label: "Comfort",
      href: "/category/comfort",
      tagline: MOOD_TAGLINES.comfort,
      icon: MOOD_ICONS.comfort,
      imageUrl: comfortImg,
      count: comfortCount,
    },
    {
      label: "Everyday",
      href: "/category/everyday",
      tagline: MOOD_TAGLINES.everyday,
      icon: MOOD_ICONS.everyday,
      imageUrl: everydayImg,
      count: everydayCount,
    },
    {
      label: "Under $50",
      href: "/category/all",
      tagline: "Easy picks",
      icon: Tag,
      imageUrl:
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=200&q=70",
      count: "5+",
    },
    {
      label: "All products",
      href: "/category/all",
      tagline: "Full edit",
      icon: LayoutGrid,
      imageUrl:
        "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=200&q=70",
      count: allCount,
    },
  ];
}

function CategoryRail({
  shopCategories,
  className,
}: {
  shopCategories: ShopCategory[];
  className?: string;
}) {
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
                  quality={65}
                  loading="lazy"
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

function MobileMoodStrip({
  shopCategories,
}: {
  shopCategories: ShopCategory[];
}) {
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
                  quality={65}
                  loading="lazy"
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

function CatalogUnavailable() {
  return (
    <div
      className="glass-panel rounded-[1.5rem] px-6 py-10 text-center"
      role="status"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Catalog
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">
        Catalog temporarily unavailable
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Please refresh in a moment — guest checkout still works once products
        load. Your cart is unaffected.
      </p>
      <Link
        href="/category/all"
        className="mt-4 inline-flex text-sm font-semibold text-brand-deep underline-offset-4 hover:underline"
      >
        Try the collection
      </Link>
    </div>
  );
}

/**
 * Premium shop stage:
 * Desktop — glass category rail left + product grid.
 * Mobile  — products first, compact mood strip after (no tall rail).
 *
 * Products from catalog service (API Phase B).
 */
export async function ShopNow() {
  let conversionCatalog: Product[] = [];
  let catalogError = false;

  try {
    conversionCatalog = await getHomeProductRail(6);
  } catch {
    catalogError = true;
  }

  const shopCategories = await buildShopCategories(conversionCatalog.length);

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
          <Reveal
            delay={60}
            className="hidden lg:sticky lg:top-[calc(var(--promo-h)+5.5rem)] lg:block lg:self-start"
          >
            <CategoryRail shopCategories={shopCategories} />
          </Reveal>

          <div className="min-w-0 order-1 lg:order-none">
            {catalogError || conversionCatalog.length === 0 ? (
              <CatalogUnavailable />
            ) : (
              <Reveal delay={60} className="shop-now-grid">
                <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3">
                  {conversionCatalog.map((product, i) => (
                    <div
                      key={product.id}
                      className="shop-now-grid__item h-full min-h-0"
                      style={{ transitionDelay: `${60 + i * 35}ms` }}
                    >
                      <ProductCard
                        product={product}
                        compact
                        priority={i < 2}
                      />
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            <div className="mt-6 lg:hidden">
              <Reveal delay={120}>
                <div className="glass-panel rounded-[1.25rem] px-3 py-3.5">
                  <MobileMoodStrip shopCategories={shopCategories} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
