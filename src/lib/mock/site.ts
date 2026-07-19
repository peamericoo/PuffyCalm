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

export const mainNav = [
  { label: "Shop", href: "/category/all" },
  { label: "Recovery", href: "/category/recovery" },
  { label: "Comfort", href: "/category/comfort" },
  { label: "Everyday", href: "/category/everyday" },
  { label: "About", href: "/about" },
] as const;

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

export const homepageHero = {
  titleLine1: "Comfort That",
  titleLine2: "Elevates Your",
  titleLine3: "Every Day",
  subtitle:
    "Curated recovery tools, soft support, and practical upgrades for a lighter routine.",
  primaryCta: { label: "Shop Now", href: "/category/all" },
  imageUrl:
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1400&q=80",
  imageAlt: "Calm lifestyle wellness moment",
} as const;

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
