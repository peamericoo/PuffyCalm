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

export type NavChild = {
  label: string;
  href: string;
  blurb: string;
  /** Lucide icon name key — resolved in Header */
  icon:
    | "grid"
    | "sparkles"
    | "tag"
    | "dollar"
    | "star"
    | "hand"
    | "flame"
    | "activity"
    | "plane"
    | "armchair"
    | "sofa"
    | "thermometer"
    | "moon"
    | "monitor"
    | "target"
    | "book"
    | "truck"
    | "refresh"
    | "help";
};

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
      {
        label: "All products",
        href: "/category/all",
        icon: "grid",
        blurb: "Full catalog, one calm place",
      },
      {
        label: "New arrivals",
        href: "/category/all",
        icon: "sparkles",
        blurb: "Fresh drops this week",
      },
      {
        label: "Sale",
        href: "/category/all",
        icon: "tag",
        blurb: "Launch prices worth a look",
      },
      {
        label: "Under $50",
        href: "/category/all",
        icon: "dollar",
        blurb: "Smart upgrades, light spend",
      },
      {
        label: "Bestsellers",
        href: "/category/all",
        icon: "star",
        blurb: "What people re-order",
      },
    ],
  },
  {
    label: "Recovery",
    href: "/category/recovery",
    children: [
      {
        label: "Massage & tension",
        href: "/category/recovery",
        icon: "hand",
        blurb: "Release what you carry",
      },
      {
        label: "Heat therapy",
        href: "/category/recovery",
        icon: "flame",
        blurb: "Warmth that actually helps",
      },
      {
        label: "Neck & shoulders",
        href: "/category/recovery",
        icon: "activity",
        blurb: "Desk-day rescue kit",
      },
      {
        label: "Travel recovery",
        href: "/category/recovery",
        icon: "plane",
        blurb: "Light tools for the road",
      },
    ],
  },
  {
    label: "Comfort",
    href: "/category/comfort",
    children: [
      {
        label: "Lumbar support",
        href: "/category/comfort",
        icon: "armchair",
        blurb: "Back that stays with you",
      },
      {
        label: "Seat cushions",
        href: "/category/comfort",
        icon: "sofa",
        blurb: "Soft hours, longer focus",
      },
      {
        label: "Wraps & warmth",
        href: "/category/comfort",
        icon: "thermometer",
        blurb: "Cozy where it counts",
      },
      {
        label: "Sleep support",
        href: "/category/comfort",
        icon: "moon",
        blurb: "Wind down, properly",
      },
    ],
  },
  {
    label: "Everyday",
    href: "/category/everyday",
    children: [
      {
        label: "Desk essentials",
        href: "/category/everyday",
        icon: "monitor",
        blurb: "Small tools, better days",
      },
      {
        label: "Posture tools",
        href: "/category/everyday",
        icon: "activity",
        blurb: "Stand taller without trying",
      },
      {
        label: "Focus & routine",
        href: "/category/everyday",
        icon: "target",
        blurb: "Habits that stick",
      },
    ],
  },
  {
    label: "About",
    href: "/about",
    children: [
      {
        label: "Our story",
        href: "/about",
        icon: "book",
        blurb: "Why PuffyEasy exists",
      },
      {
        label: "Shipping",
        href: "/help#shipping",
        icon: "truck",
        blurb: "Where & how we ship",
      },
      {
        label: "Returns",
        href: "/returns",
        icon: "refresh",
        blurb: "Easy change of mind",
      },
      {
        label: "Help center",
        href: "/help",
        icon: "help",
        blurb: "Answers, quickly",
      },
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
  titleLine1: string;
  titleLine2: string;
  /** Optional accent word/phrase on line 2 */
  titleAccent?: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  imageUrl: string;
  imageAlt: string;
};

/** Homepage campaign slides — provocative, short, commercial impact */
export const heroSlides: HeroSlide[] = [
  {
    id: "slide_launch",
    titleLine1: "Your body is",
    titleLine2: "asking for better.",
    titleAccent: "better.",
    subtitle:
      "Stop living with the ache. Premium comfort & recovery — free shipping over $75.",
    ctaLabel: "Shop the launch",
    ctaHref: "/category/all",
    secondaryLabel: "See bestsellers",
    secondaryHref: "/category/recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Calm wellness lifestyle",
  },
  {
    id: "slide_recovery",
    titleLine1: "Release the tension",
    titleLine2: "you keep ignoring.",
    titleAccent: "ignoring.",
    subtitle:
      "Massage & heat therapy engineered for desk-heavy days that never clock out.",
    ctaLabel: "Unknot now",
    ctaHref: "/category/recovery",
    secondaryLabel: "Browse all",
    secondaryHref: "/category/all",
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Yoga recovery stretch lifestyle",
  },
  {
    id: "slide_comfort",
    titleLine1: "Long hours.",
    titleLine2: "Zero excuses for pain.",
    titleAccent: "pain.",
    subtitle:
      "Support that turns eight hours at a desk into eight better ones — finally.",
    ctaLabel: "Sit better",
    ctaHref: "/category/comfort",
    secondaryLabel: "Browse all",
    secondaryHref: "/category/all",
    imageUrl:
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1800&q=80",
    imageAlt: "Modern workspace comfort",
  },
  {
    id: "slide_everyday",
    titleLine1: "Tiny upgrades.",
    titleLine2: "Ridiculously better days.",
    titleAccent: "better days.",
    subtitle:
      "Posture, focus, routine — small tools that quietly change how you feel by 5pm.",
    ctaLabel: "Upgrade daily",
    ctaHref: "/category/everyday",
    secondaryLabel: "Browse all",
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
