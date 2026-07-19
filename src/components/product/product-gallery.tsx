"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProductImages } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images?: string[];
  imageUrl?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Minimal square gallery — sharp edges, thin active border, soft image swap.
 * Reference: Seoul Bird / quiet commerce.
 */
export function ProductGallery({
  images,
  imageUrl,
  alt,
  className,
  priority = true,
}: ProductGalleryProps) {
  const slides = useMemo(
    () => getProductImages({ images, imageUrl }),
    [images, imageUrl],
  );
  const [index, setIndex] = useState(0);
  const active = slides[index] ?? slides[0];

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= slides.length || i === index) return;
      setIndex(i);
    },
    [index, slides.length],
  );

  useEffect(() => {
    if (slides.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go((index + 1) % slides.length);
      if (e.key === "ArrowLeft")
        go((index - 1 + slides.length) % slides.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, slides.length]);

  if (!active) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-[#f0f4f7] text-sm text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3 sm:gap-4", className)}>
      {/* Main stage — square, no radius, pure field */}
      <div className="pdp-stage group relative aspect-square w-full overflow-hidden bg-[#f0f4f7]">
        <Image
          key={active}
          src={active}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="object-cover object-center pdp-img-swap"
        />
        {/* Soft inner light on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.03] via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      </div>

      {slides.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar sm:gap-2.5">
          {slides.map((src, i) => {
            const selected = i === index;
            return (
              <li key={`${src}-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "pdp-thumb relative block h-[4.5rem] w-[4.5rem] overflow-hidden bg-[#f0f4f7] sm:h-[5.25rem] sm:w-[5.25rem]",
                    "border transition-[border-color,transform,box-shadow] duration-250 ease-out",
                    selected
                      ? "border-foreground scale-[1.02] shadow-[0_6px_18px_-10px_rgb(26_35_50/0.35)]"
                      : "border-transparent hover:border-foreground/25 active:scale-[0.98]",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="84px"
                    className={cn(
                      "object-cover transition-transform duration-500 ease-out",
                      selected ? "scale-100" : "scale-[1.04] hover:scale-100",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
