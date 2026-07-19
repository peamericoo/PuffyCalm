import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: "prod_001",
    slug: "shiatsu-neck-shoulder-massager",
    name: "Shiatsu Neck & Shoulder Massager",
    shortDescription: "Deep kneading massage with soothing heat.",
    description:
      "A premium shiatsu massager designed for desk-heavy days. Targets neck and shoulders with rhythmic kneading and gentle heat to release built-up tension.",
    price: 54.0,
    compareAtPrice: 69.0,
    currency: "USD",
    categorySlugs: ["recovery", "all"],
    imageGradient: "from-sky-200/80 via-sky-100 to-stone-100",
    imageEmoji: "💆",
    rating: 4.8,
    reviewCount: 214,
    badges: ["bestseller", "sale"],
    features: ["Shiatsu nodes", "Optional heat", "Hands-free design"],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_002",
    slug: "mini-massage-gun-premium",
    name: "Mini Massage Gun",
    shortDescription: "Quiet, powerful recovery that fits in a bag.",
    description:
      "Compact percussion therapy with a soft-touch body and whisper-quiet motor. Ideal for travel, post-workout recovery, and everyday stiffness.",
    price: 49.0,
    currency: "USD",
    categorySlugs: ["recovery", "all"],
    imageGradient: "from-stone-200/70 via-sky-50 to-white",
    imageEmoji: "🔫",
    rating: 4.7,
    reviewCount: 168,
    badges: ["bestseller"],
    features: ["Portable size", "Multiple speeds", "USB-C charging"],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_003",
    slug: "led-massage-gun",
    name: "LED Display Massage Gun",
    shortDescription: "Precision recovery with a clear LED display.",
    description:
      "A refined massage gun with an LED intensity display and balanced grip. Built for people who want control without complexity.",
    price: 55.0,
    currency: "USD",
    categorySlugs: ["recovery", "all"],
    imageGradient: "from-sky-100 via-white to-cream",
    imageEmoji: "⚡",
    rating: 4.6,
    reviewCount: 97,
    badges: ["new"],
    features: ["LED display", "Ergonomic handle", "4 attachments"],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_004",
    slug: "heated-eye-massager",
    name: "Heated Eye Massager",
    shortDescription: "Warm compression for tired, screen-heavy eyes.",
    description:
      "Soft heated eye therapy with gentle compression and calm vibration. A ritual for evenings after long screen sessions.",
    price: 52.0,
    compareAtPrice: 64.0,
    currency: "USD",
    categorySlugs: ["recovery", "comfort", "all"],
    imageGradient: "from-cream via-sky-50 to-white",
    imageEmoji: "👁️",
    rating: 4.9,
    reviewCount: 142,
    badges: ["bestseller"],
    features: ["Warm compress", "Soft blindfold fit", "Rechargeable"],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_005",
    slug: "lumbar-support-cushion",
    name: "Lumbar Support Cushion",
    shortDescription: "Posture-friendly support for work chairs.",
    description:
      "Memory-foam lumbar support that keeps your lower back comfortable through long meetings, deep work, and travel.",
    price: 39.0,
    currency: "USD",
    categorySlugs: ["comfort", "all"],
    imageGradient: "from-stone-100 via-cream to-sky-50",
    imageEmoji: "🪑",
    rating: 4.5,
    reviewCount: 88,
    features: ["Memory foam", "Adjustable strap", "Breathable cover"],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_006",
    slug: "orthopedic-seat-cushion",
    name: "Orthopedic Seat Cushion",
    shortDescription: "Pressure-relief seating for home and office.",
    description:
      "An orthopedic seat cushion designed to reduce pressure and keep you comfortable during long hours of sitting.",
    price: 42.0,
    currency: "USD",
    categorySlugs: ["comfort", "all"],
    imageGradient: "from-sky-50 via-white to-stone-100",
    imageEmoji: "☁️",
    rating: 4.6,
    reviewCount: 121,
    badges: ["new"],
    features: ["Pressure relief", "Non-slip base", "Machine-washable cover"],
    inStock: true,
    featured: false,
  },
  {
    id: "prod_007",
    slug: "heated-neck-wrap",
    name: "Heated Neck Wrap",
    shortDescription: "Soft heat therapy for stiff necks and shoulders.",
    description:
      "A plush heated neck wrap that delivers steady warmth where tension collects — perfect after flights, workouts, or long days.",
    price: 44.0,
    currency: "USD",
    categorySlugs: ["recovery", "comfort", "all"],
    imageGradient: "from-cream via-stone-100 to-sky-50",
    imageEmoji: "🧣",
    rating: 4.7,
    reviewCount: 76,
    features: ["Even heat zones", "Soft fabric", "Auto shut-off"],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_008",
    slug: "aluminum-laptop-stand",
    name: "Aluminum Laptop Stand",
    shortDescription: "Elevate your setup. Improve your posture.",
    description:
      "A minimal aluminum laptop stand that raises your screen to a healthier height and keeps your desk feeling open and calm.",
    price: 45.0,
    currency: "USD",
    categorySlugs: ["everyday", "all"],
    imageGradient: "from-stone-200/60 via-white to-sky-50",
    imageEmoji: "💻",
    rating: 4.8,
    reviewCount: 203,
    badges: ["bestseller"],
    features: ["Solid aluminum", "Ventilated design", "Foldable"],
    inStock: true,
    featured: true,
  },
];

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  if (slug === "all") return products;
  return products.filter((p) => p.categorySlugs.includes(slug));
}
