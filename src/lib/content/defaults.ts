/**
 * Offline / empty fallback for home CMS.
 * Intentionally empty — no demo Unsplash or launch copy.
 * Admin fills real content via /admin/content.
 */

import type { HeroSlide, HomeContent } from "@/types/content";

export const FALLBACK_PROMO_MESSAGES: string[] = [];

export const FALLBACK_HERO_SLIDES: HeroSlide[] = [];

export function fallbackHomeContent(): HomeContent {
  return {
    promoMessages: [...FALLBACK_PROMO_MESSAGES],
    heroSlides: FALLBACK_HERO_SLIDES.map((s) => ({ ...s })),
    updatedAt: null,
  };
}
