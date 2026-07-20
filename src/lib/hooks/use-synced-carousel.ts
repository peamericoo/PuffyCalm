"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * Global calm carousel clock — every ProductImageCarousel on the page
 * advances on the same tick so galleries feel coordinated, not frantic.
 */
const DEFAULT_INTERVAL_MS = 5800;

let tick = 0;
const listeners = new Set<() => void>();
let timerId: ReturnType<typeof setInterval> | null = null;
let activeInterval = DEFAULT_INTERVAL_MS;

function emit() {
  listeners.forEach((l) => l());
}

function startTimer(intervalMs: number) {
  if (typeof window === "undefined") return;
  if (timerId !== null && activeInterval === intervalMs) return;
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  activeInterval = intervalMs;
  timerId = setInterval(() => {
    tick += 1;
    emit();
  }, intervalMs);
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  startTimer(activeInterval);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };
}

function getSnapshot() {
  return tick;
}

function getServerSnapshot() {
  return 0;
}

/**
 * Returns a slide index synced to the global clock.
 * When `paused` is true, freezes on the current slide and **unsubscribes**
 * from the global clock (no re-renders every tick while idle/off-screen).
 */
export function useSyncedCarouselIndex(
  slideCount: number,
  paused: boolean,
  intervalMs: number = DEFAULT_INTERVAL_MS,
) {
  const globalTick = useSyncExternalStore(
    useCallback(
      (onStoreChange: () => void) => {
        // Paused carousels must not re-render on every global tick.
        if (paused) return () => {};
        return subscribe(onStoreChange);
      },
      [paused],
    ),
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!paused) startTimer(intervalMs);
  }, [intervalMs, paused]);

  const liveIndex =
    slideCount > 0 ? ((globalTick % slideCount) + slideCount) % slideCount : 0;

  /**
   * Freeze index while paused — React “adjust state while rendering” pattern
   * (no refs during render; no setState-in-effect).
   */
  const [pauseHold, setPauseHold] = useState<{
    paused: boolean;
    index: number | null;
  }>({ paused: false, index: null });

  if (paused !== pauseHold.paused) {
    setPauseHold({
      paused,
      index: paused ? liveIndex : null,
    });
  }

  const setManual = useCallback(
    (next: number) => {
      if (slideCount <= 0) return;
      const pinned = ((next % slideCount) + slideCount) % slideCount;
      setPauseHold((prev) => ({
        paused: prev.paused,
        index: pinned,
      }));
    },
    [slideCount],
  );

  const index = pauseHold.index ?? liveIndex;

  return { index, setManual, globalTick };
}

export const CAROUSEL_INTERVAL_MS = DEFAULT_INTERVAL_MS;
