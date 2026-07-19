"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
}

/**
 * Resilient product image carousel for mocks → real media later.
 * - All instances share one calm global clock (coordinated advances)
 * - Slow crossfade (~1.4s) — premium, low anxiety
 * - Pauses on hover, focus, touch, or `paused` prop
 * - Works with 0/1/N images without crashing
 */
export function ProductImageCarousel({
  images,
  imageUrl,
  alt,
  className,
  intervalMs = CAROUSEL_INTERVAL_MS,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw",
  priority = false,
  showDots = true,
  paused: pausedExternal = false,
}: ProductImageCarouselProps) {
  const slides = useMemo(
    () => getProductImages({ images, imageUrl }),
    [images, imageUrl],
  );
  const [localPaused, setLocalPaused] = useState(false);
  const multi = slides.length > 1;
  const paused = pausedExternal || localPaused || !multi;

  const { index, setManual } = useSyncedCarouselIndex(
    slides.length,
    paused,
    intervalMs,
  );

  if (slides.length === 0) {
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

  return (
    <div
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
        return (
          <div
            key={`${src}-${i}`}
            className={cn(
              "absolute inset-0 carousel-slide",
              active ? "carousel-slide-active" : "carousel-slide-idle",
            )}
            aria-hidden={!active}
          >
            <Image
              src={src}
              alt={active ? alt : ""}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              className="object-cover object-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.03]"
            />
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
