/** CMS-lite home content shapes — mirrors FastAPI /content/home. */

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

export type LifestyleTile = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  span: "tall" | "wide" | "square";
};

export type PromoSettings = {
  speedSeconds: number;
  color: string;
};

export type HomeContent = {
  promoMessages: string[];
  promoSettings: PromoSettings;
  heroSlides: HeroSlide[];
  lifestyleCollections: LifestyleTile[];
  updatedAt?: string | null;
};
