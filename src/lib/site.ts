/**
 * Static storefront chrome (brand, nav, footer, lifestyle modules).
 * Not catalog data — product/category/reviews come from the API.
 * Phase J: promo + hero live in content API / `lib/content/defaults`.
 */

export const siteConfig = {
  name: "PuffyCalm",
  tagline: "Products that make everyday life better",
  description:
    "Curated comfort, recovery, and smart everyday essentials — designed to feel calm, premium, and effortless.",
  url: "https://puffycalm.com",
  email: "hello@puffycalm.com",
  supportEmail: "support@puffycalm.com",
  social: {
    tiktok: "https://www.tiktok.com/@puffycalm",
    instagram: "https://www.instagram.com/puffycalm",
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
        blurb: "Why PuffyCalm exists",
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
    { label: "About PuffyCalm", href: "/about" },
    { label: "Privacy policy", href: "/privacy" },
    { label: "Terms of service", href: "/terms" },
    { label: "Account", href: "/account" },
  ],
} as const;

/**
 * Home lifestyle tiles — empty until you add CMS support or hardcode real assets.
 * Component returns null when the list is empty (no Unsplash demo tiles).
 */
export const lifestyleCollections: readonly {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  span: "tall" | "wide" | "square";
}[] = [];
