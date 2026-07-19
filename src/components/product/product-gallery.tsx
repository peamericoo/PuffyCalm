"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
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
 * Large square gallery + ambilight + fullscreen viewer.
 * Seoul Bird structure, YouTube-style static ambient glow per image.
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
      const next = ((i % slides.length) + slides.length) % slides.length;
      setIndex(next);
    },
    [slides.length],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  const openLightbox = useCallback(() => setLightbox(true), []);
  const closeLightbox = useCallback(() => setLightbox(false), []);

  /* Keyboard nav when lightbox open; Escape always closes */
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeLightbox, lightbox, next, prev]);

  /* Lock scroll in fullscreen */
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
      <div className={cn("flex w-full flex-col gap-0", className)}>
        {/* Stage + ambilight backplane */}
        <div className="pdp-stage-wrap relative">
          {/* Ambient light — blurred clone of active image, dissipates color */}
          <div aria-hidden className="pdp-ambilight" key={`amb-${active}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active} alt="" className="pdp-ambilight-img" />
          </div>

          <div className="pdp-stage group relative aspect-square w-full overflow-hidden bg-[#eef3f6] sm:aspect-[5/5.1] lg:aspect-square xl:min-h-[min(72vh,720px)]">
            <button
              type="button"
              onClick={openLightbox}
              className="absolute inset-0 z-[1] cursor-zoom-in"
              aria-label="View fullscreen"
            >
              <span className="sr-only">Open fullscreen gallery</span>
            </button>

            <Image
              key={active}
              src={active}
              alt={alt}
              fill
              priority={priority}
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="pointer-events-none object-cover object-center pdp-img-swap"
            />

            {/* Expand control */}
            <button
              type="button"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                openLightbox();
              }}
              aria-label="Fullscreen"
              className={cn(
                "pdp-icon pdp-icon--expand absolute right-3 top-3 z-[2]",
                "flex h-10 w-10 items-center justify-center bg-white/90 text-foreground",
                "border border-foreground/10 shadow-sm backdrop-blur-sm",
                "opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100",
                "hover:bg-white focus-visible:opacity-100",
              )}
            >
              <Maximize2
                className="pdp-icon-svg h-4 w-4"
                strokeWidth={2.1}
              />
            </button>

            {/* Inline prev/next on desktop hover */}
            {multi ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                  aria-label="Previous image"
                  className={cn(
                    "pdp-icon pdp-icon--prev absolute left-3 top-1/2 z-[2] -translate-y-1/2",
                    "hidden h-10 w-10 items-center justify-center bg-white/90 text-foreground",
                    "border border-foreground/10 shadow-sm backdrop-blur-sm lg:flex",
                    "opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100",
                  )}
                >
                  <ChevronLeft
                    className="pdp-icon-svg h-5 w-5"
                    strokeWidth={2}
                  />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  aria-label="Next image"
                  className={cn(
                    "pdp-icon pdp-icon--next absolute right-3 top-1/2 z-[2] -translate-y-1/2",
                    "hidden h-10 w-10 items-center justify-center bg-white/90 text-foreground",
                    "border border-foreground/10 shadow-sm backdrop-blur-sm lg:flex",
                    "opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100",
                  )}
                >
                  <ChevronRight
                    className="pdp-icon-svg h-5 w-5"
                    strokeWidth={2}
                  />
                </button>
              </>
            ) : null}

            {multi ? (
              <span className="pointer-events-none absolute bottom-3 right-3 z-[2] bg-black/45 px-2 py-0.5 text-[11px] font-medium tabular-nums tracking-wide text-white backdrop-blur-sm">
                {index + 1} / {slides.length}
              </span>
            ) : null}
          </div>
        </div>

        {/* Thumbs — flush strip, no radius */}
        {multi ? (
          <ul className="mt-0 flex w-full border-t border-foreground/[0.06]">
            {slides.map((src, i) => {
              const selected = i === index;
              return (
                <li
                  key={`${src}-${i}`}
                  className="min-w-0 flex-1 border-r border-foreground/[0.06] last:border-r-0"
                >
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`View image ${i + 1}`}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "relative block aspect-square w-full overflow-hidden bg-[#eef3f6]",
                      "transition-[opacity,filter] duration-250 ease-out",
                      selected
                        ? "opacity-100 ring-2 ring-inset ring-foreground"
                        : "opacity-55 hover:opacity-90",
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {/* Fullscreen lightbox — optimized viewing */}
      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — fullscreen`}
          className="pdp-lightbox fixed inset-0 z-[80] flex flex-col bg-[#0a0e12]/[0.96]"
        >
          {/* Ambient in dark room */}
          <div aria-hidden className="pdp-lightbox-amb" key={`lb-amb-${active}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active} alt="" />
          </div>

          <div className="relative z-[1] flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-[12px] font-medium tracking-wide text-white/70 tabular-nums">
              {index + 1} / {slides.length}
            </p>
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close fullscreen"
              className="pdp-icon pdp-icon--close flex h-11 w-11 items-center justify-center text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <X className="pdp-icon-svg h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 items-center justify-center px-2 sm:px-10">
            {multi ? (
              <button
                type="button"
                onClick={prev}
                aria-label="Previous image"
                className="pdp-icon pdp-icon--prev absolute left-2 top-1/2 z-[2] flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/85 transition hover:bg-white/10 hover:text-white sm:left-4 sm:h-14 sm:w-14"
              >
                <ChevronLeft className="pdp-icon-svg h-7 w-7" strokeWidth={1.75} />
              </button>
            ) : null}

            <div className="relative h-full max-h-[min(82vh,900px)] w-full max-w-[min(92vw,1100px)]">
              <Image
                key={`lb-${active}`}
                src={active}
                alt={alt}
                fill
                priority
                sizes="100vw"
                className="object-contain pdp-img-swap"
              />
            </div>

            {multi ? (
              <button
                type="button"
                onClick={next}
                aria-label="Next image"
                className="pdp-icon pdp-icon--next absolute right-2 top-1/2 z-[2] flex h-12 w-12 -translate-y-1/2 items-center justify-center text-white/85 transition hover:bg-white/10 hover:text-white sm:right-4 sm:h-14 sm:w-14"
              >
                <ChevronRight className="pdp-icon-svg h-7 w-7" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>

          {multi ? (
            <div className="relative z-[1] flex justify-center gap-0 overflow-x-auto px-4 pb-5 pt-3 no-scrollbar sm:pb-7">
              {slides.map((src, i) => {
                const selected = i === index;
                return (
                  <button
                    key={`lb-t-${src}-${i}`}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Image ${i + 1}`}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "relative h-14 w-14 shrink-0 overflow-hidden border border-transparent sm:h-16 sm:w-16",
                      selected
                        ? "border-white opacity-100"
                        : "opacity-40 hover:opacity-75",
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
