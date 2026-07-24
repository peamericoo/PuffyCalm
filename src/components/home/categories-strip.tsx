import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Cloud,
  Sparkles,
  SunMedium,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { DisplayStack } from "@/components/shared/section-heading";
import { listCategories } from "@/lib/catalog/service";
import type { Category } from "@/types/product";
import { cn } from "@/lib/utils";

const moodMeta: Record<
  string,
  { icon: LucideIcon; accent: string; note: string }
> = {
  recovery: {
    icon: Sparkles,
    accent: "from-brand-deep/70 via-brand/20 to-transparent",
    note: "Unknot desk-day tension",
  },
  comfort: {
    icon: Cloud,
    accent: "from-[#2f6a8c]/70 via-brand/15 to-transparent",
    note: "Sit softer, last longer",
  },
  everyday: {
    icon: SunMedium,
    accent: "from-cta/55 via-brand-deep/25 to-transparent",
    note: "Small tools, better 5pm",
  },
};

/**
 * Shop by mood — non-linear editorial mosaic.
 * Categories from catalog service (API Phase B).
 * Hidden when empty or when storefront has no published products (clean launch).
 */
export async function CategoriesStrip() {
  let items: Category[] = [];
  try {
    const cats = await listCategories();
    // Only categories with real cover images (Admin → Categories). No Unsplash seed.
    items = cats.filter(
      (c) =>
        c.slug !== "all" &&
        Boolean(c.imageUrl) &&
        !c.imageUrl.includes("unsplash.com"),
    );
  } catch {
    items = [];
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-x-clip px-[var(--shell-gutter)] py-10 sm:px-5 sm:py-14">
      <span
        className="pointer-events-none absolute -left-16 top-8 h-48 w-48 rounded-full bg-brand/20 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-cta/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px]">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-8">
          <DisplayStack
            eyebrow="Collections"
            title="Shop how you want to feel"
            description="Three doors in — recovery, comfort, or everyday upgrades."
            accent="feel"
            motion="slide"
            className="max-w-md"
          />
          <Reveal delay={80} variant="fade" once={false} className="hidden sm:block">
            <Link
              href="/category/all"
              prefetch={false}
              className="pressable glass-btn inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-brand-deep"
            >
              Browse all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
        </div>

        {/* Mobile: horizontal snap rail */}
        <div className="md:hidden">
          <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 snap-x snap-mandatory no-scrollbar">
            {items.map((category, index) => {
              const meta = moodMeta[category.slug] ?? moodMeta.recovery;
              const Icon = meta.icon;
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  prefetch={false}
                  className={cn(
                    "group relative shrink-0 snap-center overflow-hidden rounded-[1.4rem]",
                    "w-[min(78vw,300px)] h-[300px]",
                    "shadow-[0_16px_40px_-24px_rgb(26_35_50/0.35)]",
                    index === 0 && "ml-0",
                  )}
                >
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    sizes="78vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-t",
                      meta.accent,
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md">
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                    <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                      0{index + 1}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="font-display text-2xl font-medium tracking-tight text-white">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">{meta.note}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white">
                      Explore
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
            <div className="w-2 shrink-0" aria-hidden />
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Swipe to explore moods
          </p>
        </div>

        {/* Desktop / tablet: asymmetric bento */}
        <div className="hidden md:grid md:grid-cols-12 md:grid-rows-[minmax(200px,1fr)_minmax(200px,1fr)] md:gap-4 md:min-h-[420px] lg:min-h-[460px]">
          {items[0] ? (
            <Reveal className="md:col-span-7 md:row-span-2 h-full min-h-[420px]">
              <MoodTile
                href={`/category/${items[0].slug}`}
                name={items[0].name}
                imageUrl={items[0].imageUrl}
                tagline={moodMeta[items[0].slug]?.note ?? items[0].tagline}
                index={0}
                icon={moodMeta[items[0].slug]?.icon ?? Sparkles}
                accent={moodMeta[items[0].slug]?.accent}
                featured
              />
            </Reveal>
          ) : null}

          {items[1] ? (
            <Reveal delay={70} className="md:col-span-5 md:row-span-1 h-full min-h-[200px]">
              <MoodTile
                href={`/category/${items[1].slug}`}
                name={items[1].name}
                imageUrl={items[1].imageUrl}
                tagline={moodMeta[items[1].slug]?.note ?? items[1].tagline}
                index={1}
                icon={moodMeta[items[1].slug]?.icon ?? Cloud}
                accent={moodMeta[items[1].slug]?.accent}
              />
            </Reveal>
          ) : null}

          {items[2] ? (
            <Reveal delay={120} className="md:col-span-5 md:row-span-1 h-full min-h-[200px]">
              <MoodTile
                href={`/category/${items[2].slug}`}
                name={items[2].name}
                imageUrl={items[2].imageUrl}
                tagline={moodMeta[items[2].slug]?.note ?? items[2].tagline}
                index={2}
                icon={moodMeta[items[2].slug]?.icon ?? SunMedium}
                accent={moodMeta[items[2].slug]?.accent}
              />
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MoodTile({
  href,
  name,
  imageUrl,
  tagline,
  index,
  icon: Icon,
  accent = "from-brand-deep/70 via-brand/20 to-transparent",
  featured = false,
}: {
  href: string;
  name: string;
  imageUrl: string;
  tagline: string;
  index: number;
  icon: LucideIcon;
  accent?: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "group relative flex h-full min-h-[200px] overflow-hidden rounded-[1.5rem]",
        "shadow-[0_18px_44px_-28px_rgb(26_35_50/0.3)]",
        "outline outline-1 outline-white/40 transition-transform duration-500",
        "hover:-translate-y-1",
      )}
    >
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes={featured ? "(max-width: 1280px) 58vw, 700px" : "(max-width: 1280px) 42vw, 480px"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
      <div className={cn("absolute inset-0 bg-gradient-to-t", accent)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
          0{index + 1}
        </span>
      </div>

      <div
        className={cn(
          "relative z-10 mt-auto flex w-full items-end justify-between gap-3",
          featured ? "p-6 lg:p-8" : "p-5",
        )}
      >
        <div className="min-w-0">
          <h3
            className={cn(
              "font-display font-medium tracking-tight text-white",
              featured ? "text-3xl lg:text-4xl" : "text-2xl",
            )}
          >
            {name}
          </h3>
          <p
            className={cn(
              "mt-1 text-white/80",
              featured ? "text-sm sm:text-base" : "text-sm",
            )}
          >
            {tagline}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform duration-300 group-hover:rotate-45">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
