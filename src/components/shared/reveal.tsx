"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type RevealVariant = "rise" | "soft" | "slide" | "scale" | "fade";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Extra delay after entering viewport (ms) */
  delay?: number;
  /** as="h2" etc — defaults to div */
  as?: "div" | "header" | "section" | "span";
  /**
   * Motion recipe. Each variant enters/exits differently.
   * Default "rise" for general content.
   */
  variant?: RevealVariant;
  /**
   * If true, animate once and stay. If false, reset fluidly when leaving
   * the viewport and replay when returning.
   */
  once?: boolean;
}

function subscribeSkipReveal(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 767px)");
  reduced.addEventListener("change", onChange);
  mobile.addEventListener("change", onChange);
  return () => {
    reduced.removeEventListener("change", onChange);
    mobile.removeEventListener("change", onChange);
  };
}

function getSkipReveal() {
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    window.matchMedia("(max-width: 767px)").matches
  );
}

/** Mobile / reduced-motion: skip IO and show immediately (SSR: shown). */
function useSkipReveal() {
  return useSyncExternalStore(subscribeSkipReveal, getSkipReveal, () => true);
}

/**
 * Soft scroll entrance. Supports per-block variants and optional re-entry.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
  variant = "rise",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const skip = useSkipReveal();
  const [inView, setInView] = useState(false);
  const shown = skip || inView;

  useEffect(() => {
    if (skip) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, skip]);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "reveal",
        `reveal-${variant}`,
        shown && "reveal-in",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      data-reveal={shown ? "in" : "out"}
    >
      {children}
    </Tag>
  );
}
