"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { ProductLightbox } from "@/components/product/product-lightbox";
import { getProductImages } from "@/types/product";
import iconStyles from "./product-icons.module.css";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images?: string[];
  imageUrl?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * PDP gallery stage + thumbs. Fullscreen zoom lives in ProductLightbox.
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
  const [open, setOpen] = useState(false);
  const active = slides[index] ?? slides[0];
  const multi = slides.length > 1;

  const go = useCallback(
    (i: number) => {
      if (slides.length === 0) return;
      setIndex(((i % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

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
    <>
      <div className={cn("flex w-full flex-col gap-3", className)}>
        <div className="group relative aspect-square w-full overflow-hidden bg-[#f0f4f7]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute inset-0 z-[1] cursor-zoom-in"
            aria-label="Open zoom viewer"
          >
            <span className="sr-only">Open zoom viewer</span>
          </button>

          <Image
            key={active}
            src={active}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="pointer-events-none object-cover object-center animate-fade-in"
          />

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Zoom"
            className={cn(
              iconStyles.expand,
              "absolute right-3 top-3 z-[2] flex h-9 w-9 items-center justify-center",
              "border border-foreground/10 bg-white/95 text-foreground shadow-sm",
              "opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
            )}
          >
            <Maximize2
              className={cn(iconStyles.iconSvg, "h-4 w-4")}
              strokeWidth={2}
            />
          </button>

          {multi ? (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className={cn(
                  iconStyles.prev,
                  "absolute left-3 top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center",
                  "border border-foreground/10 bg-white/95 text-foreground shadow-sm lg:flex",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                <ChevronLeft
                  className={cn(iconStyles.iconSvg, "h-5 w-5")}
                  strokeWidth={2}
                />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className={cn(
                  iconStyles.next,
                  "absolute right-3 top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center",
                  "border border-foreground/10 bg-white/95 text-foreground shadow-sm lg:flex",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                <ChevronRight
                  className={cn(iconStyles.iconSvg, "h-5 w-5")}
                  strokeWidth={2}
                />
              </button>
              <span className="pointer-events-none absolute bottom-3 right-3 z-[2] bg-black/50 px-2 py-0.5 text-[11px] font-medium tabular-nums text-white">
                {index + 1}/{slides.length}
              </span>
            </>
          ) : null}
        </div>

        {multi ? (
          <ul className="flex gap-2 overflow-x-auto no-scrollbar">
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
                      "relative block h-16 w-16 overflow-hidden bg-[#f0f4f7] sm:h-[4.5rem] sm:w-[4.5rem]",
                      "border transition-colors",
                      selected
                        ? "border-foreground"
                        : "border-transparent hover:border-foreground/25",
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {open ? (
        <ProductLightbox
          slides={slides}
          index={index}
          alt={alt}
          onClose={() => setOpen(false)}
          onIndexChange={setIndex}
        />
      ) : null}
    </>
  );
}
