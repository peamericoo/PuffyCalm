"use client";

import Image from "next/image";
import { memo, useLayoutEffect, useRef, useState } from "react";
import {
  CAROUSEL_INTERVAL_MS,
  useSyncedCarouselIndex,
} from "@/lib/hooks/use-synced-carousel";
import { getProductImages } from "@/types/product";
import { cn } from "@/lib/utils";

export interface ProductImageCarouselProps {
  /** Prefer full gallery; falls back to imageUrl */
  images?: string[];
  imageUrl?: string;
  alt: string;
  className?: string;
  /** Interval between slides (ms) — shared global clock */
  intervalMs?: number;
  /** Next/Image sizes attribute */
  sizes?: string;
  priority?: boolean;
  /** Show soft dots indicator */
  showDots?: boolean;
  /** External pause (e.g. parent card hover) */
  paused?: boolean;
  /** Next/Image quality 1–100 (default 75) */
  quality?: number;
  /** Mount the full carousel only after a grid card has user intent. */
  armed?: boolean;
}

/** Slides that must be decoded for seamless crossfade (current + neighbors). */
function neighborIndexes(index: number, count: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const prev = (index - 1 + count) % count;
  const next = (index + 1) % count;
  return Array.from(new Set([index, prev, next]));
}

function NoProductImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center bg-brand-soft text-sm text-muted-foreground",
        className,
      )}
    >
      No image
    </div>
  );
}

function StaticProductImage({
  src,
  alt,
  className,
  sizes,
  priority,
  quality,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority: boolean;
  quality: number;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden product-plate",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        className="object-cover object-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.03]"
      />
    </div>
  );
}

/**
 * Product image carousel — full CSS crossfade kept intact.
 *
 * Performance without killing motion:
 * - All slide *layers* stay mounted so opacity/transform transitions run
 * - Only current + neighbors get a real <Image> decode (window of ≤3)
 * - Off-screen: pause clock subscription (no tick re-renders), keep last frame
 * - Hover/focus/touch still freeze like before
 * - Grid cold path: static image only, no IO/timer/layer window until armed
 */
export const ProductImageCarousel = memo(function ProductImageCarousel({
  images,
  imageUrl,
  alt,
  className,
  intervalMs = CAROUSEL_INTERVAL_MS,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw",
  priority = false,
  showDots = true,
  paused: pausedExternal = false,
  quality = 75,
  armed = true,
}: ProductImageCarouselProps) {
  const slides = getProductImages({ images, imageUrl });

  if (slides.length === 0) {
    return <NoProductImage className={className} />;
  }

  if (!armed || slides.length === 1) {
    return (
      <StaticProductImage
        src={slides[0]}
        alt={alt}
        className={className}
        sizes={sizes}
        priority={priority}
        quality={quality}
      />
    );
  }

  return (
    <LiveProductImageCarousel
      slides={slides}
      alt={alt}
      className={className}
      intervalMs={intervalMs}
      sizes={sizes}
      priority={priority}
      showDots={showDots}
      paused={pausedExternal}
      quality={quality}
    />
  );
});

ProductImageCarousel.displayName = "ProductImageCarousel";

function LiveProductImageCarousel({
  slides,
  alt,
  className,
  intervalMs,
  sizes,
  priority,
  showDots,
  paused: pausedExternal,
  quality,
}: {
  slides: string[];
  alt: string;
  className?: string;
  intervalMs: number;
  sizes: string;
  priority: boolean;
  showDots: boolean;
  paused: boolean;
  quality: number;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [localPaused, setLocalPaused] = useState(false);
  const multi = slides.length > 1;

  const paused =
    pausedExternal || localPaused || !multi || !inView;

  const { index, setManual } = useSyncedCarouselIndex(
    slides.length,
    paused,
    intervalMs,
  );

  // Decode only current + neighbors so rich grids keep motion without piling images.
  const decoded = new Set(neighborIndexes(index, slides.length));

  // Initial + ongoing visibility (layout for first paint above the fold).
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const update = (visible: boolean) => setInView(visible);

    // Sync first paint if already on screen
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.bottom > -40 && rect.top < vh + 80) {
      update(true);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        update(entry.isIntersecting);
      },
      { rootMargin: "120px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full w-full overflow-hidden product-plate",
        className,
      )}
      onMouseEnter={() => setLocalPaused(true)}
      onMouseLeave={() => setLocalPaused(false)}
      onFocusCapture={() => setLocalPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setLocalPaused(false);
        }
      }}
      onTouchStart={() => setLocalPaused(true)}
      onTouchEnd={() => {
        window.setTimeout(() => setLocalPaused(false), 2200);
      }}
      role={multi ? "group" : undefined}
      aria-roledescription={multi ? "carousel" : undefined}
      aria-label={multi ? `${alt} gallery` : undefined}
    >
      {slides.map((src, i) => {
        const active = i === index;
        const shouldDecode = decoded.has(i);
        return (
          <div
            key={`${src}-${i}`}
            className={cn(
              "absolute inset-0 carousel-slide",
              active ? "carousel-slide-active" : "carousel-slide-idle",
            )}
            aria-hidden={!active}
          >
            {shouldDecode ? (
              <Image
                src={src}
                alt={active ? alt : ""}
                fill
                sizes={sizes}
                quality={quality}
                priority={priority && i === 0}
                loading={priority && i === 0 ? "eager" : "lazy"}
                className="object-cover object-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.03]"
              />
            ) : (
              /* Placeholder keeps layer geometry for CSS; no decode cost */
              <div
                className="absolute inset-0 bg-brand-soft/40"
                aria-hidden
              />
            )}
          </div>
        );
      })}

      {multi && showDots ? (
        <div className="absolute bottom-2.5 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/20 px-1.5 py-1 backdrop-blur-[6px]">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setManual(i);
              }}
              className={cn(
                "h-1 rounded-full transition-all duration-700 ease-out",
                i === index ? "w-3.5 bg-white" : "w-1 bg-white/45",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
