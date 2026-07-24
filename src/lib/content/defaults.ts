/**
 * Offline / empty fallback for home CMS.
 * Intentionally empty — fill via Admin → Content.
 */

import type {
  HeroSlide,
  HomeContent,
  LifestyleTile,
  PromoSettings,
} from "@/types/content";

export const FALLBACK_PROMO_MESSAGES: string[] = [];
export const FALLBACK_PROMO_SETTINGS: PromoSettings = {
  speedSeconds: 32,
  color: "#3a7ca5",
};
export const FALLBACK_HERO_SLIDES: HeroSlide[] = [];
export const FALLBACK_LIFESTYLE: LifestyleTile[] = [];

export function fallbackHomeContent(): HomeContent {
  return {
    promoMessages: [...FALLBACK_PROMO_MESSAGES],
    promoSettings: { ...FALLBACK_PROMO_SETTINGS },
    heroSlides: FALLBACK_HERO_SLIDES.map((s) => ({ ...s })),
    lifestyleCollections: FALLBACK_LIFESTYLE.map((t) => ({ ...t })),
    updatedAt: null,
  };
}
