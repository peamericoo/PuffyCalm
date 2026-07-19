import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/lib/mock/categories";
import { getFeaturedProducts } from "@/lib/mock/products";
import { homepageHero } from "@/lib/mock/site";
import { formatMoney } from "@/lib/format";

/**
 * Desktop-first hero stage: fills most of the first viewport as a
 * horizontal bento (not a tall vertical stack of giant bars).
 */
export function Hero() {
  const spotlight = getFeaturedProducts()[0];
  const sideCats = categories.filter((c) => c.slug !== "all").slice(0, 2);

  return (
    <section className="px-3 pb-3 sm:px-5 sm:pb-4">
      <div className="mx-auto grid max-w-[1400px] gap-3 lg:h-[min(78vh,760px)] lg:grid-cols-12 lg:grid-rows-2 lg:gap-4">
        {/* Main stage — wide impact panel */}
        <div className="group relative min-h-[380px] overflow-hidden rounded-[1.75rem] bg-hero lg:col-span-8 lg:row-span-2 lg:min-h-0 animate-scale-in">
          <Image
            src={homepageHero.imageUrl}
            alt={homepageHero.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover object-center img-zoom opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-hero-deep via-hero-deep/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-hero-deep/80 via-transparent to-hero-deep/20" />

          <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-cream-text backdrop-blur-md animate-fade-up">
              <Sparkles className="h-3.5 w-3.5" />
              New season calm
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-300 animate-[pulse-dot_1.6s_ease_infinite]" />
            </div>

            <div className="max-w-xl space-y-5">
              <h1 className="font-display text-[2.4rem] font-medium leading-[1.05] tracking-tight text-cream-text sm:text-5xl lg:text-[3.35rem] xl:text-[3.6rem] animate-fade-up delay-1">
                <span className="block">{homepageHero.titleLine1}</span>
                <span className="block">{homepageHero.titleLine2}</span>
                <span className="block text-white/90">
                  {homepageHero.titleLine3}
                </span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-cream-text/80 sm:text-base animate-fade-up delay-2">
                {homepageHero.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3 animate-fade-up delay-3">
                <Button asChild variant="light" size="lg" className="pressable">
                  <Link href={homepageHero.primaryCta.href}>
                    {homepageHero.primaryCta.label}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="pressable border border-white/25 text-cream-text hover:bg-white/10 hover:text-white"
                >
                  <Link href="/about">
                    Our story
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Spotlight product — top right */}
        {spotlight ? (
          <Link
            href={`/product/${spotlight.slug}`}
            className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-[1.5rem] bg-card p-4 shadow-sm card-soft lg:col-span-4 lg:row-span-1 lg:min-h-0 animate-fade-up delay-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Spotlight
                </p>
                <h2 className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
                  {spotlight.name}
                </h2>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-transform duration-300 group-hover:rotate-12">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mt-3 h-28 overflow-hidden rounded-2xl product-plate sm:h-32 lg:h-[42%]">
              <Image
                src={spotlight.imageUrl}
                alt={spotlight.imageAlt}
                fill
                sizes="33vw"
                className="object-cover img-zoom"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-semibold">
                {formatMoney(spotlight.price, spotlight.currency)}
              </p>
              <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-accent">
                Buy now
              </span>
            </div>
          </Link>
        ) : null}

        {/* Category pair — bottom right, split */}
        <div className="grid min-h-[180px] grid-cols-2 gap-3 lg:col-span-4 lg:row-span-1 lg:min-h-0 lg:gap-4">
          {sideCats.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`group relative overflow-hidden rounded-[1.35rem] card-soft animate-fade-up ${i === 0 ? "delay-3" : "delay-4"}`}
            >
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                sizes="20vw"
                className="object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                <p className="font-display text-lg font-medium text-white sm:text-xl">
                  {cat.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-white/75">
                  {cat.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
