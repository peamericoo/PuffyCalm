"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * When `paused` is true, freezes on the current slide (hover / touch control).
 * `setManual` pins a slide (and keeps pin while paused; clears on resume).
 */
export function useSyncedCarouselIndex(
  slideCount: number,
  paused: boolean,
  intervalMs: number = DEFAULT_INTERVAL_MS,
) {
  const globalTick = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    startTimer(intervalMs);
  }, [intervalMs]);

  const liveIndex =
    slideCount > 0 ? ((globalTick % slideCount) + slideCount) % slideCount : 0;

  const holdRef = useRef<number | null>(null);
  const wasPaused = useRef(paused);
  const [, bump] = useState(0);

  // Capture slide when pause begins; clear when pause ends
  if (paused && !wasPaused.current) {
    holdRef.current = liveIndex;
  }
  if (!paused && wasPaused.current) {
    holdRef.current = null;
  }
  wasPaused.current = paused;

  const index = holdRef.current ?? liveIndex;

  const setManual = useCallback(
    (next: number) => {
      if (slideCount <= 0) return;
      holdRef.current =
        ((next % slideCount) + slideCount) % slideCount;
      bump((n) => n + 1);
    },
    [slideCount],
  );

  return { index, setManual, globalTick };
}

export const CAROUSEL_INTERVAL_MS = DEFAULT_INTERVAL_MS;
