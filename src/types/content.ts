/** CMS-lite home content shapes (Phase J) — mirrors FastAPI /content/home. */

export type HeroSlide = {
  id: string;
  titleLine1: string;
  titleLine2: string;
  titleAccent?: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  imageUrl: string;
  imageAlt: string;
};

export type HomeContent = {
  promoMessages: string[];
  heroSlides: HeroSlide[];
  updatedAt?: string | null;
};
