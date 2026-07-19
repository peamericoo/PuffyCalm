"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProductImages } from "@/types/product";
import { cn } from "@/lib/utils";

export interface ProductImageCarouselProps {
  /** Prefer full gallery; falls back to imageUrl */
  images?: string[];
  imageUrl?: string;
  alt: string;
  className?: string;
  /** Interval between slides (ms) */
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
 * - Auto-rotates when 2+ images
 * - Pauses on hover, focus, touch, or `paused` prop
 * - Works with 0/1/N images without crashing
 */
export function ProductImageCarousel({
  images,
  imageUrl,
  alt,
  className,
  intervalMs = 3200,
  sizes = "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw",
  priority = false,
  showDots = true,
  paused: pausedExternal = false,
}: ProductImageCarouselProps) {
  const slides = useMemo(
    () => getProductImages({ images, imageUrl }),
    [images, imageUrl],
  );
  const [index, setIndex] = useState(0);
  const [localPaused, setLocalPaused] = useState(false);
  const multi = slides.length > 1;
  const paused = pausedExternal || localPaused || !multi;

  const go = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, intervalMs, slides.length]);

  // Keep index valid if gallery length changes
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

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
      className={cn("relative h-full w-full overflow-hidden product-plate", className)}
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
        // brief pause after touch so user can look, then resume
        window.setTimeout(() => setLocalPaused(false), 1600);
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
              "absolute inset-0 transition-opacity duration-700 ease-out",
              active ? "opacity-100 z-[1]" : "opacity-0 z-0",
            )}
            aria-hidden={!active}
          >
            <Image
              src={src}
              alt={active ? alt : ""}
              fill
              sizes={sizes}
              priority={priority && i === 0}
              className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover/card:scale-[1.04]"
            />
          </div>
        );
      })}

      {multi && showDots ? (
        <div className="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
