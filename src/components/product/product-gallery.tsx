"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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
 * Minimal PDP gallery — large stage + thumbnail strip (manual, no autoplay).
 * Inspired by quiet commerce layouts (minim-style).
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

  if (!active) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center rounded-2xl bg-brand-soft text-sm text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-3 sm:gap-4", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] bg-[#f3f7fa] sm:aspect-square sm:rounded-[1.5rem]">
        <Image
          key={active}
          src={active}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover object-center animate-fade-in"
        />
      </div>

      {slides.length > 1 ? (
        <ul className="flex gap-2.5 overflow-x-auto pb-0.5 no-scrollbar sm:gap-3">
          {slides.map((src, i) => {
            const selected = i === index;
            return (
              <li key={`${src}-${i}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "relative h-[4.25rem] w-[4.25rem] overflow-hidden rounded-xl bg-[#f3f7fa] sm:h-[5rem] sm:w-[5rem] sm:rounded-2xl",
                    "ring-1 transition-all duration-200",
                    selected
                      ? "ring-2 ring-foreground/85 ring-offset-2 ring-offset-white"
                      : "ring-border/70 hover:ring-brand/40",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
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
