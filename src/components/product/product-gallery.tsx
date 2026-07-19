"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
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
 * Simple PDP gallery: square stage, fixed thumbs, optional fullscreen.
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
  const [lightbox, setLightbox] = useState(false);
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

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, next, prev]);

  useEffect(() => {
    if (!lightbox) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

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
            onClick={() => setLightbox(true)}
            className="absolute inset-0 z-[1] cursor-zoom-in"
            aria-label="View fullscreen"
          >
            <span className="sr-only">Open fullscreen</span>
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
            onClick={() => setLightbox(true)}
            aria-label="Fullscreen"
            className={cn(
              "pdp-icon pdp-icon--expand absolute right-3 top-3 z-[2]",
              "flex h-9 w-9 items-center justify-center border border-foreground/10 bg-white/95 text-foreground shadow-sm",
              "opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
            )}
          >
            <Maximize2 className="pdp-icon-svg h-4 w-4" strokeWidth={2} />
          </button>

          {multi ? (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className={cn(
                  "pdp-icon pdp-icon--prev absolute left-3 top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center",
                  "border border-foreground/10 bg-white/95 text-foreground shadow-sm lg:flex",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                <ChevronLeft className="pdp-icon-svg h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className={cn(
                  "pdp-icon pdp-icon--next absolute right-3 top-1/2 z-[2] hidden h-9 w-9 -translate-y-1/2 items-center justify-center",
                  "border border-foreground/10 bg-white/95 text-foreground shadow-sm lg:flex",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                <ChevronRight className="pdp-icon-svg h-5 w-5" strokeWidth={2} />
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

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — fullscreen`}
          className="fixed inset-0 z-[80] flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-[12px] font-medium tabular-nums text-white/70">
              {index + 1} / {slides.length}
            </p>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close"
              className="pdp-icon pdp-icon--close flex h-10 w-10 items-center justify-center text-white/90 hover:bg-white/10"
            >
              <X className="pdp-icon-svg h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-12">
            {multi ? (
              <button
                type="button"
                onClick={prev}
                aria-label="Previous"
                className="pdp-icon pdp-icon--prev absolute left-2 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/85 hover:bg-white/10 sm:left-4"
              >
                <ChevronLeft className="pdp-icon-svg h-7 w-7" strokeWidth={1.75} />
              </button>
            ) : null}

            <div className="relative h-full max-h-[min(80vh,860px)] w-full max-w-[min(90vw,960px)]">
              <Image
                key={`lb-${active}`}
                src={active}
                alt={alt}
                fill
                priority
                sizes="100vw"
                className="object-contain animate-fade-in"
              />
            </div>

            {multi ? (
              <button
                type="button"
                onClick={next}
                aria-label="Next"
                className="pdp-icon pdp-icon--next absolute right-2 top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center text-white/85 hover:bg-white/10 sm:right-4"
              >
                <ChevronRight className="pdp-icon-svg h-7 w-7" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>

          {multi ? (
            <div className="flex justify-center gap-2 px-4 pb-5 pt-3 sm:pb-6">
              {slides.map((src, i) => (
                <button
                  key={`lb-t-${src}-${i}`}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Image ${i + 1}`}
                  className={cn(
                    "relative h-12 w-12 shrink-0 overflow-hidden border sm:h-14 sm:w-14",
                    i === index
                      ? "border-white opacity-100"
                      : "border-transparent opacity-40 hover:opacity-70",
                  )}
                >
                  <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
