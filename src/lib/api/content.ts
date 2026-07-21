/**
 * Public home content client (Phase J).
 * Tags: `home`, `content` — revalidated after admin save.
 */

import { getApiBaseUrl } from "@/lib/api/config";
import { fallbackHomeContent } from "@/lib/content/defaults";
import type { HeroSlide, HomeContent, LifestyleTile } from "@/types/content";

const DEFAULT_REVALIDATE = 60;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeSlide(raw: Record<string, unknown>): HeroSlide | null {
  const id = asString(raw.id);
  const titleLine1 = asString(raw.titleLine1 ?? raw.title_line1);
  const titleLine2 = asString(raw.titleLine2 ?? raw.title_line2);
  const subtitle = asString(raw.subtitle);
  const ctaLabel = asString(raw.ctaLabel ?? raw.cta_label);
  const ctaHref = asString(raw.ctaHref ?? raw.cta_href);
  const imageUrl = asString(raw.imageUrl ?? raw.image_url);
  if (!id || !titleLine1 || !titleLine2 || !ctaHref || !imageUrl) return null;

  const slide: HeroSlide = {
    id,
    titleLine1,
    titleLine2,
    subtitle,
    ctaLabel: ctaLabel || "Shop",
    ctaHref,
    imageUrl,
    imageAlt: asString(raw.imageAlt ?? raw.image_alt, titleLine1),
  };

  const accent = raw.titleAccent ?? raw.title_accent;
  if (typeof accent === "string" && accent.trim()) {
    slide.titleAccent = accent.trim();
  }
  const secLabel = raw.secondaryLabel ?? raw.secondary_label;
  const secHref = raw.secondaryHref ?? raw.secondary_href;
  if (typeof secLabel === "string" && secLabel.trim()) {
    slide.secondaryLabel = secLabel.trim();
  }
  if (typeof secHref === "string" && secHref.trim()) {
    slide.secondaryHref = secHref.trim();
  }
  return slide;
}

function normalizeLifestyle(raw: Record<string, unknown>): LifestyleTile | null {
  const id = asString(raw.id);
  const title = asString(raw.title);
  const href = asString(raw.href);
  const imageUrl = asString(raw.imageUrl ?? raw.image_url);
  if (!id || !title || !href || !imageUrl) return null;
  const spanRaw = asString(raw.span, "square").toLowerCase();
  const span =
    spanRaw === "tall" || spanRaw === "wide" || spanRaw === "square"
      ? spanRaw
      : "square";
  return { id, title, href, imageUrl, span };
}

export function normalizeHomeContent(raw: Record<string, unknown>): HomeContent {
  const promosRaw = raw.promoMessages ?? raw.promo_messages;
  const slidesRaw = raw.heroSlides ?? raw.hero_slides;
  const lifeRaw = raw.lifestyleCollections ?? raw.lifestyle_collections;

  const promoMessages = Array.isArray(promosRaw)
    ? promosRaw
        .filter((m): m is string => typeof m === "string")
        .map((m) => m.trim())
        .filter(Boolean)
    : [];

  const heroSlides: HeroSlide[] = [];
  if (Array.isArray(slidesRaw)) {
    for (const item of slidesRaw) {
      if (item && typeof item === "object") {
        const slide = normalizeSlide(item as Record<string, unknown>);
        if (slide) heroSlides.push(slide);
      }
    }
  }

  const lifestyleCollections: LifestyleTile[] = [];
  if (Array.isArray(lifeRaw)) {
    for (const item of lifeRaw) {
      if (item && typeof item === "object") {
        const tile = normalizeLifestyle(item as Record<string, unknown>);
        if (tile) lifestyleCollections.push(tile);
      }
    }
  }

  return {
    promoMessages,
    heroSlides,
    lifestyleCollections,
    updatedAt:
      raw.updatedAt == null && raw.updated_at == null
        ? null
        : asString(raw.updatedAt ?? raw.updated_at, "") || null,
  };
}

/**
 * Fetch home CMS content. On failure returns fallback (site never blank).
 * Uses Next fetch cache tags for admin revalidate.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/v1/content/home`, {
      headers: { Accept: "application/json" },
      next: {
        revalidate: DEFAULT_REVALIDATE,
        tags: ["home", "content"],
      },
    });
    if (!res.ok) {
      console.error("[content] home fetch failed", res.status);
      return fallbackHomeContent();
    }
    const data = (await res.json()) as Record<string, unknown>;
    // Empty promo/hero is a valid clean storefront — do not re-inject demo fallbacks.
    return normalizeHomeContent(data);
  } catch (e) {
    console.error("[content] home fetch error", e);
    return fallbackHomeContent();
  }
}
