"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/lib/mock/site";
import { cn } from "@/lib/utils";

const AUTO_MS = 6500;

/**
 * Editorial commerce opener — impact without full-viewport tax.
 * Shorter stage, bigger type, one clear path into the catalog.
 * Mobile: compact, readable, product-first hierarchy for the page.
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
  }, [paused, count]);

  return (
    <section
      className="shop-stage relative w-full overflow-hidden pb-3 sm:pb-4 sm:pt-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured campaigns"
    >
      {/*
        Height strategy:
        - Mobile: ~48–52vh max, never full screen — products stay close
        - Desktop: cinematic but capped so shop is near
        Gutter uses shop-stage sky (same as What customers buy first).
      */}
      <div className="relative mx-auto w-full max-w-[1760px] px-0 sm:px-3 lg:px-4">
        <div
          className={cn(
            "relative overflow-hidden",
            "h-[min(52dvh,420px)] min-h-[320px]",
            "sm:h-[min(56dvh,480px)] sm:min-h-[380px] sm:rounded-[1.75rem]",
            "lg:h-[min(58dvh,540px)] lg:min-h-[420px]",
          )}
        >
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
                    "object-cover object-[center_30%]",
                    isActive && "hero-kenburns",
                  )}
                />
                {/* Cleaner, lighter wash — less “dark full-screen ad” */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/88 via-[#1a2332]/45 to-[#1a2332]/15" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/75 via-transparent to-[#1a2332]/25" />
              </div>
            );
          })}

          <div
            className="relative z-10 flex h-full flex-col justify-end px-5 pb-5 sm:px-8 sm:pb-7 lg:px-12 lg:pb-9"
            style={{
              paddingTop: "calc(var(--promo-h) + var(--nav-h) + 0.5rem)",
            }}
          >
            <div
              key={active.id}
              className="flex max-w-3xl flex-col gap-3 sm:gap-4 animate-fade-up"
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95 backdrop-blur-md sm:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-cta animate-[pulse-dot_1.5s_ease_infinite]" />
                {active.eyebrow}
              </div>

              <h1 className="font-display font-medium tracking-tight text-white">
                <span className="block text-[2.65rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                  {active.titleLine1}
                </span>
                <span className="block text-[2.65rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                  {active.titleLine2}
                  {active.titleLine3 ? (
                    <>
                      {" "}
                      <span className="text-brand">{active.titleLine3}</span>
                    </>
                  ) : null}
                </span>
              </h1>

              <p className="max-w-md text-[15px] leading-snug text-white/78 sm:max-w-lg sm:text-base lg:text-lg">
                {active.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 sm:gap-3">
                <Link
                  href={active.ctaHref}
                  className="pressable glass-btn-cta inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white sm:h-12 sm:px-7 sm:text-[15px]"
                >
                  {active.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {active.secondaryHref && active.secondaryLabel ? (
                  <Link
                    href={active.secondaryHref}
                    className="pressable inline-flex h-11 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/18 sm:h-12 sm:px-6"
                  >
                    {active.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Slim controls — less chrome, more product path */}
            <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
              <div className="flex items-center gap-1.5">
                {heroSlides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => go(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      i === index
                        ? "w-8 bg-white sm:w-9"
                        : "w-1.5 bg-white/40 hover:bg-white/70",
                    )}
                  />
                ))}
              </div>

              <div className="hidden items-center gap-1.5 sm:flex">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous slide"
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next slide"
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
