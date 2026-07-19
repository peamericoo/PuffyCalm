"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import styles from "./product-spotlight.module.css";
import { cn } from "@/lib/utils";

interface ProductSpotlightProps {
  className?: string;
  /** Spotlight radius as % of the shorter side feel (CSS size) */
  size?: "md" | "lg";
}

/**
 * Stage spotlight over product imagery.
 * Tracks pointer on the parent (must be position:relative).
 * Idle drift when the cursor leaves — stays visible on touch devices.
 * Fully self-contained CSS module — nothing in globals.
 */
export function ProductSpotlight({
  className,
  size = "lg",
}: ProductSpotlightProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const hoverMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setCanHover(hoverMq.matches);
      setReduced(motionMq.matches);
    };
    sync();
    hoverMq.addEventListener("change", sync);
    motionMq.addEventListener("change", sync);
    return () => {
      hoverMq.removeEventListener("change", sync);
      motionMq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const parent = root?.parentElement;
    if (!root || !parent || !canHover) return;

    const move = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      root.style.setProperty("--sx", `${x.toFixed(2)}%`);
      root.style.setProperty("--sy", `${y.toFixed(2)}%`);
      setActive(true);
    };

    const leave = () => setActive(false);

    parent.addEventListener("pointermove", move, { passive: true });
    parent.addEventListener("pointerleave", leave);
    parent.addEventListener("pointercancel", leave);

    return () => {
      parent.removeEventListener("pointermove", move);
      parent.removeEventListener("pointerleave", leave);
      parent.removeEventListener("pointercancel", leave);
    };
  }, [canHover]);

  const idle = !active && !reduced;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        styles.root,
        active && styles.rootActive,
        idle && styles.rootIdle,
        className,
      )}
      style={
        {
          "--spot-r": size === "lg" ? "48%" : "36%",
        } as CSSProperties
      }
    >
      <div className={cn(styles.veil, idle && styles.veilIdle)} />
      <div className={cn(styles.beam, idle && styles.beamIdle)} />
      <div className={cn(styles.core, idle && styles.coreIdle)} />
      <div className={cn(styles.streak, idle && styles.streakIdle)} />
      <div className={styles.grain} />
    </div>
  );
}
