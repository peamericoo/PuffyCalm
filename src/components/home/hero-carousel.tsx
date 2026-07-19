"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/lib/mock/site";
import { cn } from "@/lib/utils";

const AUTO_MS = 6500;

/**
 * Editorial commerce opener.
 * Desktop: soft pointer parallax. Mobile: static, clipped, no extra motion cost.
 */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [allowParallax, setAllowParallax] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
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
    const mq = window.matchMedia("(min-width: 768px) and (hover: hover)");
    const sync = () => setAllowParallax(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!allowParallax) return;
      const el = stageRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setParallax({ x, y });
    },
    [allowParallax],
  );

  const onPointerLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 });
  }, []);

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

  const px = allowParallax ? parallax.x : 0;
  const py = allowParallax ? parallax.y : 0;

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
          ref={stageRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className={cn(
            "relative w-full max-w-full overflow-hidden",
            "h-[min(52dvh,420px)] min-h-[320px]",
            "sm:h-[min(56dvh,480px)] sm:min-h-[380px] sm:rounded-[1.85rem]",
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
                <div
                  className={cn(
                    "absolute inset-0 md:inset-[-3%]",
                    allowParallax && "will-change-transform transition-transform duration-500 ease-out",
                  )}
                  style={
                    allowParallax && isActive
                      ? {
                          transform: `translate3d(${px * -10}px, ${py * -8}px, 0) scale(1.05)`,
                        }
                      : undefined
                  }
                >
                  <Image
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className={cn(
                      "object-cover object-[center_30%]",
                      isActive && allowParallax && "hero-kenburns",
                    )}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/90 via-[#1a2332]/52 to-[#1a2332]/18" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a2332]/80 via-transparent to-[#1a2332]/28" />
              </div>
            );
          })}

          {/* Content pad uses --shell-gutter (shared with .nav-outer) */}
          <div
            className="relative z-10 flex h-full w-full max-w-full flex-col justify-end px-[var(--shell-gutter)] pb-5 sm:px-8 sm:pb-7 lg:px-12 lg:pb-9"
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
                className={cn(
                  "display-title mt-0 font-display font-medium tracking-tight text-white",
                  allowParallax && "will-change-transform transition-transform duration-300 ease-out",
                )}
                style={
                  allowParallax
                    ? {
                        transform: `translate3d(${px * 14}px, ${py * 10}px, 0)`,
                        textShadow: "0 2px 28px rgb(0 0 0 / 0.35)",
                      }
                    : { textShadow: "0 2px 28px rgb(0 0 0 / 0.35)" }
                }
              >
                <span className="hero-line block text-[2.45rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[4.15rem]">
                  {active.titleLine1}
                </span>
                <span className="hero-line hero-line--delay block text-[2.45rem] leading-[0.98] sm:text-5xl md:text-6xl lg:text-[4.15rem]">
                  {renderLine2(active.titleLine2, active.titleAccent)}
                </span>
              </h1>

              <p
                className={cn(
                  "display-lead mt-0 max-w-md text-[15px] font-medium leading-snug text-white/90 sm:max-w-lg sm:text-base lg:text-lg",
                  allowParallax && "will-change-transform transition-transform duration-500 ease-out",
                )}
                style={
                  allowParallax
                    ? {
                        transform: `translate3d(${px * 8}px, ${py * 6}px, 0)`,
                        textShadow: "0 1px 16px rgb(0 0 0 / 0.4)",
                      }
                    : { textShadow: "0 1px 16px rgb(0 0 0 / 0.4)" }
                }
              >
                {active.subtitle}
              </p>

              <div
                className={cn(
                  "flex flex-wrap items-center gap-2.5 pt-0.5 sm:gap-3",
                  allowParallax && "will-change-transform transition-transform duration-700 ease-out",
                )}
                style={
                  allowParallax
                    ? {
                        transform: `translate3d(${px * 4}px, ${py * 3}px, 0)`,
                      }
                    : undefined
                }
              >
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
