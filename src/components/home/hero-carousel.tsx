"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/types/content";

const AUTO_MS = 6500;

type Props = {
  slides: HeroSlide[];
};

/**
 * Editorial commerce opener.
 * Slides from CMS-lite API (Phase J) — passed by the home RSC.
 */
export function HeroCarousel({ slides }: Props) {
  const heroSlides = slides.length > 0 ? slides : [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = heroSlides.length;
  const active = heroSlides[index] ?? heroSlides[0];

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const renderLine2 = (line: string, accent?: string) => {
    if (!accent || !line.endsWith(accent)) {
      return line;
    }
    const head = line.slice(0, line.length - accent.length);
    return (
      <>
        {head}
        <span className="display-title-accent">{accent}</span>
      </>
    );
  };

  /* Clean storefront: no demo images — soft brand stage until admin adds slides. */
  if (!active || count === 0) {
    return (
      <section
        className="relative w-full max-w-[100%] overflow-x-clip pb-2 sm:pb-3 sm:pt-2"
        aria-label="Welcome"
      >
        <div className="relative mx-auto w-full max-w-[min(1920px,100%)] px-0 sm:px-1.5 lg:px-2">
          <div
            className={cn(
              "relative flex w-full max-w-full flex-col justify-end overflow-hidden",
              "brand-gradient",
              "h-[min(38dvh,310px)] min-h-[230px]",
              "sm:h-[min(42dvh,350px)] sm:min-h-[260px] sm:rounded-[1.85rem]",
              "lg:h-[min(42dvh,365px)] lg:min-h-[280px]",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse 70% 60% at 70% 20%, rgba(255,255,255,0.35), transparent 55%)",
              }}
              aria-hidden
            />
            <div
              className="relative z-10 px-5 pb-8 sm:px-8 sm:pb-10 lg:px-12"
              style={{
                paddingTop: "calc(var(--promo-h) + var(--nav-h) + 0.5rem)",
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
                PuffyCalm
              </p>
              <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                Your store is ready.
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Add hero images and promo messages in Admin → Content. Publish
                products to fill the shelves below.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/category/all"
                  prefetch={false}
                  transitionTypes={["catalog"]}
                  className="pressable inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-foreground shadow-sm"
                >
                  Browse shop
                </Link>
                <Link
                  href="/admin/content"
                  prefetch={false}
                  className="pressable inline-flex h-11 items-center rounded-full border border-white/40 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm"
                >
                  Edit home content
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative w-full max-w-[100%] overflow-x-clip overflow-y-hidden pb-2 sm:pb-3 sm:pt-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured campaigns"
    >
      {/* Same shell gutter token as top bar — no competing horizontal systems */}
      <div className="relative mx-auto w-full max-w-[min(1920px,100%)] px-0 sm:px-1.5 lg:px-2">
        <div
          className={cn(
            "relative w-full max-w-full overflow-hidden",
            "h-[min(48dvh,390px)] min-h-[300px]",
            "sm:h-[min(50dvh,430px)] sm:min-h-[340px] sm:rounded-[1.85rem]",
            "lg:h-[min(50dvh,470px)] lg:min-h-[380px]",
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
                <div
                  className="absolute inset-0"
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
                </div>
                {/* Barely-there scrim — designed banners stay visible; text keeps soft shadow below */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/14 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/16 via-transparent to-transparent" />
              </div>
            );
          })}

          {/* Content pad uses --shell-gutter (shared with .nav-outer) */}
          <div
            className="relative z-10 flex h-full w-full max-w-full flex-col justify-end px-[var(--shell-gutter)] pb-5 sm:px-8 sm:pb-6 lg:px-12 lg:pb-7"
            style={{
              paddingTop: "calc(var(--promo-h) + var(--nav-h) + 0.5rem)",
            }}
          >
            <div
              key={active.id}
              className="display-stack display-stack--on-dark relative flex w-full max-w-3xl flex-col gap-3.5 sm:gap-4"
            >
              <span className="display-aura" aria-hidden>
                <span className="display-aura-core" />
              </span>

              <h1
                className="display-title mt-0 font-display font-medium tracking-tight text-white"
                style={{ textShadow: "0 2px 28px rgb(0 0 0 / 0.35)" }}
              >
                <span className="hero-line block text-[2.45rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[3.75rem]">
                  {active.titleLine1}
                </span>
                <span className="hero-line hero-line--delay block text-[2.45rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[3.75rem]">
                  {renderLine2(active.titleLine2, active.titleAccent)}
                </span>
              </h1>

              <p
                className="display-lead mt-0 max-w-md text-[15px] font-medium leading-snug text-white/90 sm:max-w-lg sm:text-base lg:text-[16px]"
                style={{ textShadow: "0 1px 16px rgb(0 0 0 / 0.4)" }}
              >
                {active.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 sm:gap-3">
                <Link
                  href={active.ctaHref}
                  prefetch={false}
                  transitionTypes={
                    active.ctaHref.startsWith("/category/")
                      ? ["catalog"]
                      : undefined
                  }
                  className="pressable glass-btn-cta inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white sm:h-12 sm:px-7 sm:text-[15px]"
                >
                  {active.ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {active.secondaryHref && active.secondaryLabel ? (
                  <Link
                    href={active.secondaryHref}
                    prefetch={false}
                    transitionTypes={
                      active.secondaryHref.startsWith("/category/")
                        ? ["catalog"]
                        : undefined
                    }
                    className="pressable inline-flex h-11 items-center gap-1.5 rounded-full border border-white/30 bg-white/12 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 sm:h-12 sm:px-6"
                  >
                    {active.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </div>

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
