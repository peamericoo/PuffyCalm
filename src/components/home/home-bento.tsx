import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/lib/mock/categories";
import { getFeaturedProducts } from "@/lib/mock/products";
import { formatMoney } from "@/lib/format";

/** Compact supporting row under hero — keeps desktop filled without tall stacks */
export function HomeBento() {
  const spotlight = getFeaturedProducts()[0];
  const sideCats = categories.filter((c) => c.slug !== "all").slice(0, 3);

  return (
    <section className="px-2 pb-2 sm:px-4 sm:pb-3">
      <div className="mx-auto grid max-w-[1440px] gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {spotlight ? (
          <Link
            href={`/product/${spotlight.slug}`}
            className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-card p-4 shadow-sm ring-1 ring-border/70 card-soft md:col-span-1 lg:col-span-1 animate-fade-up"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-deep">
                  Spotlight
                </p>
                <h2 className="mt-1 font-display text-lg font-medium tracking-tight text-foreground sm:text-xl">
                  {spotlight.name}
                </h2>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep transition-transform duration-300 group-hover:rotate-12">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <div className="relative mt-3 h-28 overflow-hidden rounded-2xl product-plate">
              <Image
                src={spotlight.imageUrl}
                alt={spotlight.imageAlt}
                fill
                sizes="25vw"
                className="object-cover img-zoom"
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-deep">
                {formatMoney(spotlight.price, spotlight.currency)}
              </p>
              <span className="rounded-full bg-cta px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:bg-cta-hover">
                Buy now
              </span>
            </div>
          </Link>
        ) : null}

        {sideCats.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`group relative min-h-[200px] overflow-hidden rounded-[1.35rem] card-soft animate-fade-up delay-${i + 1}`}
          >
            <Image
              src={cat.imageUrl}
              alt={cat.name}
              fill
              sizes="25vw"
              className="object-cover img-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/75 via-[#1a2332]/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-display text-xl font-medium text-white">
                {cat.name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-white/80">
                {cat.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
