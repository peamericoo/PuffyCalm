"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import iconStyles from "./product-icons.module.css";
import styles from "./product-lightbox.module.css";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;

interface ProductLightboxProps {
  slides: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Fullscreen product viewer with real zoom (in/out), pan, wheel, and keyboard.
 */
export function ProductLightbox({
  slides,
  index,
  alt,
  onClose,
  onIndexChange,
}: ProductLightboxProps) {
  const multi = slides.length > 1;
  const active = slides[index] ?? slides[0];

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const setZoomTo = useCallback((next: number) => {
    const z = clamp(Number(next.toFixed(2)), ZOOM_MIN, ZOOM_MAX);
    setZoom(z);
    if (z <= 1) setOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(
    () => setZoomTo(zoom + ZOOM_STEP),
    [setZoomTo, zoom],
  );
  const zoomOut = useCallback(
    () => setZoomTo(zoom - ZOOM_STEP),
    [setZoomTo, zoom],
  );

  const go = useCallback(
    (i: number) => {
      if (slides.length === 0) return;
      const next = ((i % slides.length) + slides.length) % slides.length;
      onIndexChange(next);
      resetView();
    },
    [onIndexChange, resetView, slides.length],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  /* Body scroll lock */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowRight" && multi) {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft" && multi) {
        e.preventDefault();
        prev();
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      }
      if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multi, next, onClose, prev, resetView, zoomIn, zoomOut]);

  const onWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.5 : ZOOM_STEP * 0.5;
      setZoomTo(zoom + delta);
    },
    [setZoomTo, zoom],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (zoom <= 1) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: offset.x,
        originY: offset.y,
      };
      setDragging(true);
    },
    [offset.x, offset.y, zoom],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset({
      x: d.originX + (e.clientX - d.startX),
      y: d.originY + (e.clientY - d.startY),
    });
  }, []);

  const endDrag = useCallback((e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDragging(false);
  }, []);

  const onDoubleClick = useCallback(() => {
    if (zoom > 1) resetView();
    else setZoomTo(2);
  }, [resetView, setZoomTo, zoom]);

  if (!active) return null;

  const pct = Math.round(zoom * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — zoom viewer`}
      className={styles.root}
    >
      <div className={styles.topBar}>
        <p className={styles.counter}>
          {index + 1} / {slides.length}
        </p>

        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={zoomOut}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" strokeWidth={2} />
          </button>
          <span className={styles.zoomLabel} aria-live="polite">
            {pct}%
          </span>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={zoomIn}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={resetView}
            disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
            aria-label="Reset zoom"
          >
            {zoom > 1 ? (
              <Minimize2 className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            className={cn(styles.toolBtn, iconStyles.close)}
            onClick={onClose}
            aria-label="Close"
          >
            <X className={cn(iconStyles.iconSvg, "h-5 w-5")} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        className={cn(
          styles.stage,
          zoom > 1 ? styles.stageZoomed : styles.stageCanZoom,
          dragging && styles.stageDragging,
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={onDoubleClick}
      >
        {multi ? (
          <button
            type="button"
            className={cn(styles.navBtn, styles.navPrev, iconStyles.prev)}
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft
              className={cn(iconStyles.iconSvg, "h-7 w-7")}
              strokeWidth={1.75}
            />
          </button>
        ) : null}

        <div
          className={cn(styles.frame, dragging && styles.frameDragging)}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <Image
            key={active}
            src={active}
            alt={alt}
            fill
            priority
            sizes="100vw"
            draggable={false}
            className={styles.image}
          />
        </div>

        {multi ? (
          <button
            type="button"
            className={cn(styles.navBtn, styles.navNext, iconStyles.next)}
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next image"
          >
            <ChevronRight
              className={cn(iconStyles.iconSvg, "h-7 w-7")}
              strokeWidth={1.75}
            />
          </button>
        ) : null}

        <p className={styles.hint}>
          Scroll to zoom · Drag to pan · Double-click to toggle · + / − / 0
        </p>
      </div>

      {multi ? (
        <div className={styles.thumbs}>
          {slides.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => go(i)}
              aria-label={`Image ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(styles.thumb, i === index && styles.thumbActive)}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
