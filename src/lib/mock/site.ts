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

export const trustPoints = [
  {
    title: "Curated for real life",
    description: "Every product is selected to make daily routines lighter.",
  },
  {
    title: "Premium feel, fair price",
    description: "Thoughtful design without the unnecessary markup.",
  },
  {
    title: "Ships to US, UK, AU & CA",
    description: "Tracked delivery and clear updates by email.",
  },
  {
    title: "Calm support",
    description: "Human help when you need it — no scripted chaos.",
  },
] as const;

export const homepageHero = {
  eyebrow: "Better living, simplified",
  title: "Make everyday feel lighter",
  subtitle:
    "Discover calm, premium products for comfort, recovery, and the little upgrades that change how your day feels.",
  primaryCta: { label: "Shop the collection", href: "/category/all" },
  secondaryCta: { label: "Why PuffyEasy", href: "/about" },
} as const;

export const homepagePromo = {
  eyebrow: "New season calm",
  title: "Recover better. Sit softer. Move freer.",
  description:
    "From heated wraps to ergonomic support and smart everyday tools — everything is chosen to help you feel good, more often.",
  cta: { label: "Explore recovery", href: "/category/recovery" },
} as const;
