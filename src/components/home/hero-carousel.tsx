"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { heroSlides } from "@/lib/mock/site";
import { cn } from "@/lib/utils";

const AUTO_MS = 5500;

/**
 * Full-bleed aggressive hero carousel with crossfade + ken burns.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = heroSlides.length;
  const active = heroSlides[index];

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, count, index]);

  return (
    <section
      className="px-2 pb-3 sm:px-4 sm:pb-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative mx-auto h-[min(88vh,920px)] min-h-[520px] max-w-[1440px] overflow-hidden rounded-[1.5rem] shadow-[0_30px_80px_-36px_rgba(26,35,50,0.35)] sm:rounded-[1.85rem] lg:min-h-[640px] animate-scale-in">
        {/* Slides */}
        {heroSlides.map((slide, i) => {
          const isActive = i === index;
          return (
            <div
              key={slide.id}
              className={cn(
                "absolute inset-0 hero-slide",
                isActive ? "hero-slide-active" : "hero-slide-idle",
              )}
              aria-hidden={!isActive}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.imageAlt}
                fill
                priority={i === 0}
                sizes="100vw"
                className={cn(
                  "object-cover object-center",
                  isActive && "hero-kenburns",
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/88 via-[#1a2332]/55 to-[#1a2332]/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/75 via-transparent to-[#1a2332]/25" />
              <div className="absolute inset-0 brand-gradient opacity-25 mix-blend-soft-light" />
            </div>
          );
        })}

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:justify-center sm:p-10 lg:p-14 xl:p-16">
          <div
            key={active.id}
            className="max-w-2xl space-y-5 sm:space-y-6 animate-fade-up"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-cta animate-[pulse-dot_1.5s_ease_infinite]" />
              {active.eyebrow}
            </div>

            <h1 className="font-display text-[2.75rem] font-medium leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem] xl:text-[4.6rem]">
              <span className="block">{active.titleLine1}</span>
              <span className="block">{active.titleLine2}</span>
              {active.titleLine3 ? (
                <span className="block text-brand">{active.titleLine3}</span>
              ) : null}
            </h1>

            <p className="max-w-lg text-sm leading-relaxed text-white/80 sm:text-base lg:text-lg">
              {active.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button asChild variant="default" size="lg" className="pressable">
                <Link href={active.ctaHref}>{active.ctaLabel}</Link>
              </Button>
              {active.secondaryHref && active.secondaryLabel ? (
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="pressable border border-white/25 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href={active.secondaryHref}>
                    {active.secondaryLabel}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between gap-4 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0 sm:bottom-10 sm:right-10 lg:bottom-12 lg:right-12">
            <div className="flex items-center gap-2 sm:hidden">
              {heroSlides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => go(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-white" : "w-1.5 bg-white/40",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous slide"
                className="pressable flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next slide"
                className="pressable flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Desktop progress dots */}
          <div className="absolute bottom-8 left-6 hidden items-center gap-2 sm:bottom-10 sm:left-10 sm:flex lg:bottom-12 lg:left-14">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "w-10 bg-white" : "w-2 bg-white/40 hover:bg-white/70",
                )}
              />
            ))}
            <span className="ml-3 text-xs font-medium tabular-nums text-white/70">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
