"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
};

export function ShopFeelAutoRail({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const pauseUntilRef = useRef(0);
  const lastUserScrollRef = useRef(0);
  const autoScrollingRef = useRef(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const mobileQuery = window.matchMedia("(max-width: 1023px)");
    let frame = 0;
    let lastFrameAt = 0;
    let inView = false;
    let enabled = mobileQuery.matches;

    const markInteraction = (duration = 2400) => {
      pauseUntilRef.current = performance.now() + duration;
      lastUserScrollRef.current = scroller.scrollLeft;
    };

    const markScroll = () => {
      if (autoScrollingRef.current) return;
      markInteraction(1800);
    };
    const markPointer = () => markInteraction(3200);
    const markWheel = () => markInteraction(2600);

    const tick = (now: number) => {
      if (!enabled || !inView || document.visibilityState === "hidden") {
        frame = 0;
        return;
      }

      if (lastFrameAt === 0) lastFrameAt = now;
      const elapsed = Math.min(now - lastFrameAt, 80);
      lastFrameAt = now;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll > 2 && now >= pauseUntilRef.current) {
        const current = scroller.scrollLeft;

        if (Math.abs(current - lastUserScrollRef.current) > 8) {
          lastUserScrollRef.current = current;
        }

        // Preserve the previous 44px/s pace while syncing work to frames.
        const next = current + directionRef.current * 0.044 * elapsed;

        if (next >= maxScroll) {
          autoScrollingRef.current = true;
          scroller.scrollLeft = maxScroll;
          directionRef.current = -1;
        } else if (next <= 0) {
          autoScrollingRef.current = true;
          scroller.scrollLeft = 0;
          directionRef.current = 1;
        } else {
          autoScrollingRef.current = true;
          scroller.scrollLeft = next;
        }

        window.requestAnimationFrame(() => {
          autoScrollingRef.current = false;
        });
      }

      frame = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!enabled || !inView || frame) return;
      lastFrameAt = 0;
      frame = window.requestAnimationFrame(tick);
    };

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastFrameAt = 0;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        if (inView) start();
        else stop();
      },
      { threshold: 0, rootMargin: "120px 0px" },
    );

    const syncViewportMode = () => {
      enabled = mobileQuery.matches;
      if (enabled) start();
      else stop();
    };

    scroller.addEventListener("pointerdown", markPointer, {
      passive: true,
    });
    scroller.addEventListener("pointermove", markPointer, {
      passive: true,
    });
    scroller.addEventListener("wheel", markWheel, {
      passive: true,
    });
    scroller.addEventListener("touchstart", markPointer, {
      passive: true,
    });
    scroller.addEventListener("touchmove", markPointer, {
      passive: true,
    });
    scroller.addEventListener("scroll", markScroll, { passive: true });
    mobileQuery.addEventListener("change", syncViewportMode);
    observer.observe(scroller);

    return () => {
      stop();
      observer.disconnect();
      scroller.removeEventListener("pointerdown", markPointer);
      scroller.removeEventListener("pointermove", markPointer);
      scroller.removeEventListener("wheel", markWheel);
      scroller.removeEventListener("touchstart", markPointer);
      scroller.removeEventListener("touchmove", markPointer);
      scroller.removeEventListener("scroll", markScroll);
      mobileQuery.removeEventListener("change", syncViewportMode);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="shop-feel-mobile-scroll overflow-x-auto lg:overflow-visible"
    >
      {children}
    </div>
  );
}
