export const siteConfig = {
  name: "PuffyEasy",
  tagline: "Products that make everyday life better",
  description:
    "Curated comfort, recovery, and smart everyday essentials — designed to feel calm, premium, and effortless.",
  url: "https://PuffyEasy.com",
  email: "hello@puffyeasy.com",
  supportEmail: "support@puffyeasy.com",
  social: {
    tiktok: "https://www.tiktok.com/@puffyeasy",
    instagram: "https://www.instagram.com/puffyeasy",
  },
} as const;

export type NavChild = { label: string; href: string };

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

/** Primary nav — children power desktop hover + mobile expand */
export const mainNav: NavItem[] = [
  {
    label: "Shop",
    href: "/category/all",
    children: [
      { label: "All products", href: "/category/all" },
      { label: "New arrivals", href: "/category/all" },
      { label: "Sale", href: "/category/all" },
      { label: "Under $50", href: "/category/all" },
      { label: "Bestsellers", href: "/category/all" },
    ],
  },
  {
    label: "Recovery",
    href: "/category/recovery",
    children: [
      { label: "Massage & tension", href: "/category/recovery" },
      { label: "Heat therapy", href: "/category/recovery" },
      { label: "Neck & shoulders", href: "/category/recovery" },
      { label: "Travel recovery", href: "/category/recovery" },
    ],
  },
  {
    label: "Comfort",
    href: "/category/comfort",
    children: [
      { label: "Lumbar support", href: "/category/comfort" },
      { label: "Seat cushions", href: "/category/comfort" },
      { label: "Wraps & warmth", href: "/category/comfort" },
      { label: "Sleep support", href: "/category/comfort" },
    ],
  },
  {
    label: "Everyday",
    href: "/category/everyday",
    children: [
      { label: "Desk essentials", href: "/category/everyday" },
      { label: "Posture tools", href: "/category/everyday" },
      { label: "Focus & routine", href: "/category/everyday" },
    ],
  },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our story", href: "/about" },
      { label: "Shipping", href: "/help#shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Help center", href: "/help" },
    ],
  },
];

export const footerNav = {
  shop: [
    { label: "All products", href: "/category/all" },
    { label: "Recovery", href: "/category/recovery" },
    { label: "Comfort", href: "/category/comfort" },
    { label: "Everyday essentials", href: "/category/everyday" },
    { label: "Wishlist", href: "/wishlist" },
  ],
  help: [
    { label: "Help center", href: "/help" },
    { label: "Returns & exchanges", href: "/returns" },
    { label: "Shipping", href: "/help#shipping" },
    { label: "Contact", href: "/help#contact" },
    { label: "Track order", href: "/account/orders" },
  ],
  company: [
    { label: "About PuffyEasy", href: "/about" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
    { label: "Account", href: "/account" },
  ],
} as const;

/** Commercial rotating promo messages — top of site */
export const promoMessages = [
  "🎉 We just launched — welcome to PuffyEasy",
  "🔥 Launch sale: up to 20% off bestsellers this week",
  "🚚 Free tracked shipping on orders $75+",
  "⏱️ Limited launch offer — comfort upgrades from $39",
  "✨ Guest checkout · Ships to US, UK, AU & CA",
  "💆 New drops: recovery tools that actually feel premium",
] as const;

export type HeroSlide = {
  id: string;
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  titleLine3?: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  imageUrl: string;
  imageAlt: string;
};

/** Homepage campaign slides — short copy, commercial impact */
export const heroSlides: HeroSlide[] = [
  {
    id: "slide_launch",
    eyebrow: "Launch offer",
    titleLine1: "Feel better",
    titleLine2: "every day",
    subtitle: "Premium comfort & recovery — free shipping over $75.",
    ctaLabel: "Shop the sale",
    ctaHref: "/category/all",
    secondaryLabel: "Bestsellers",
    secondaryHref: "/category/recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Calm wellness lifestyle",
  },
  {
    id: "slide_recovery",
    eyebrow: "Recovery",
    titleLine1: "Tension out.",
    titleLine2: "Energy back.",
    subtitle: "Massage & heat therapy for desk-heavy days.",
    ctaLabel: "Shop recovery",
    ctaHref: "/category/recovery",
    secondaryLabel: "View all",
    secondaryHref: "/category/all",
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Yoga recovery stretch lifestyle",
  },
  {
    id: "slide_comfort",
    eyebrow: "Comfort",
    titleLine1: "Sit softer.",
    titleLine2: "Work longer.",
    subtitle: "Support that turns long hours into better hours.",
    ctaLabel: "Shop comfort",
    ctaHref: "/category/comfort",
    secondaryLabel: "View all",
    secondaryHref: "/category/all",
    imageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Modern workspace comfort",
  },
  {
    id: "slide_everyday",
    eyebrow: "Everyday",
    titleLine1: "Small upgrades.",
    titleLine2: "Big difference.",
    subtitle: "Tools for posture, focus, and better routines.",
    ctaLabel: "Shop everyday",
    ctaHref: "/category/everyday",
    secondaryLabel: "View all",
    secondaryHref: "/category/all",
    imageUrl:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Productive everyday desk setup",
  },
];

export const lifestyleCollections = [
  {
    id: "life_1",
    title: "Desk Reset",
    href: "/category/comfort",
    imageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1000&q=80",
    span: "tall" as const,
  },
  {
    id: "life_2",
    title: "Evening Unwind",
    href: "/category/recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1000&q=80",
    span: "wide" as const,
  },
  {
    id: "life_3",
    title: "Better Posture",
    href: "/category/everyday",
    imageUrl:
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1000&q=80",
    span: "square" as const,
  },
  {
    id: "life_4",
    title: "Travel Light",
    href: "/category/recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80",
    span: "square" as const,
  },
] as const;
