"use client";

import { useEffect } from "react";

export function ScrollToTopOnMount() {
  useEffect(() => {
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    scrollTop();
    const raf = window.requestAnimationFrame(scrollTop);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return null;
}
