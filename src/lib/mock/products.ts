import type { Product } from "@/types/product";

/**
 * Product fixtures — each item has a multi-image gallery for the
 * shared ProductImageCarousel (autoplay, pause on hover/touch).
 */
export const products: Product[] = [
  {
    id: "prod_001",
    slug: "shiatsu-neck-shoulder-massager",
    name: "Shiatsu Neck & Shoulder Massager",
    shortDescription:
      "Deep kneading massage with optional heat for desk-heavy days.",
    description:
      "A premium shiatsu massager designed for desk-heavy days. Targets neck and shoulders with rhythmic kneading and gentle heat — so tension doesn’t stack into tomorrow.",
    price: 54.0,
    compareAtPrice: 69.0,
    currency: "USD",
    categorySlugs: ["recovery", "all"],
    categoryLabel: "Recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Person enjoying a calm neck massage ritual",
    rating: 4.8,
    reviewCount: 214,
    badges: ["bestseller", "sale"],
    features: ["Shiatsu nodes", "Optional heat", "Hands-free design"],
    specs: [
      {
        label: "Therapy",
        value: "Shiatsu kneading nodes with optional heat",
      },
      {
        label: "Fit",
        value: "Hands-free shoulder drape for desk sessions",
      },
      {
        label: "Use",
        value: "15–20 minute daily reset after screen time",
      },
      {
        label: "Feel",
        value: "Premium soft contact surfaces, quiet motor",
      },
    ],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_002",
    slug: "mini-massage-gun-premium",
    name: "Mini Massage Gun",
    shortDescription:
      "Quiet percussion recovery that fits in your everyday bag.",
    description:
      "Compact percussion therapy with a soft-touch body and whisper-quiet motor. Built for bags, travel days, and quick recovery between meetings.",
    price: 49.0,
    currency: "USD",
    categorySlugs: ["recovery", "all"],
    categoryLabel: "Recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Active recovery with compact massage tools",
    rating: 4.7,
    reviewCount: 168,
    badges: ["bestseller"],
    features: ["Portable size", "Multiple speeds", "USB-C charging"],
    specs: [
      { label: "Form", value: "Pocket-friendly body, soft-touch grip" },
      { label: "Power", value: "Multiple speeds with quiet motor" },
      { label: "Charge", value: "USB-C for easy everyday charging" },
      { label: "Travel", value: "Light enough for carry-on recovery" },
    ],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_003",
    slug: "led-massage-gun",
    name: "LED Display Massage Gun",
    shortDescription: "Precision recovery with clear intensity control.",
    description:
      "A refined massage gun with an LED intensity display and balanced grip — precision recovery without the bulk of gym-only tools.",
    price: 55.0,
    currency: "USD",
    categorySlugs: ["recovery", "all"],
    categoryLabel: "Recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1599058945522-28d584b6f14f?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Strength and recovery training lifestyle",
    rating: 4.6,
    reviewCount: 97,
    badges: ["new"],
    features: ["LED display", "Ergonomic handle", "4 attachments"],
    specs: [
      { label: "Control", value: "LED intensity display for clear levels" },
      { label: "Grip", value: "Ergonomic handle balanced for longer sessions" },
      { label: "Kit", value: "Four attachments for neck, back, and legs" },
      { label: "Use", value: "Pre-workout warm-up or post-desk release" },
    ],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_004",
    slug: "heated-eye-massager",
    name: "Heated Eye Massager",
    shortDescription: "Warm compression for tired, screen-heavy eyes.",
    description:
      "Soft heated eye therapy with gentle compression and calm vibration. Made for late screens, dry flights, and the 4pm eye strain you ignore.",
    price: 52.0,
    compareAtPrice: 64.0,
    currency: "USD",
    categorySlugs: ["recovery", "comfort", "all"],
    categoryLabel: "Comfort",
    imageUrl:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Calm wellness rest and eye recovery",
    rating: 4.9,
    reviewCount: 142,
    badges: ["bestseller", "sale"],
    features: ["Warm compress", "Soft blindfold fit", "Rechargeable"],
    specs: [
      { label: "Therapy", value: "Warm compress with gentle compression" },
      { label: "Fit", value: "Soft blindfold contour, light-blocking" },
      { label: "Power", value: "Rechargeable for nightly wind-down" },
      { label: "Ritual", value: "10-minute reset after long screen blocks" },
    ],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_005",
    slug: "lumbar-support-cushion",
    name: "Lumbar Support Cushion",
    shortDescription: "Posture-friendly support for long work sessions.",
    description:
      "Memory-foam lumbar support that keeps your lower back comfortable through long work sessions — posture help that doesn’t feel medical.",
    price: 39.0,
    currency: "USD",
    categorySlugs: ["comfort", "all"],
    categoryLabel: "Comfort",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Minimal home office comfort setup",
    rating: 4.5,
    reviewCount: 88,
    features: ["Memory foam", "Adjustable strap", "Breathable cover"],
    specs: [
      { label: "Support", value: "Contour memory foam for lower back" },
      { label: "Fit", value: "Adjustable strap for most office chairs" },
      { label: "Cover", value: "Breathable fabric for all-day sessions" },
      { label: "Setup", value: "Seconds to attach — no tools" },
    ],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_006",
    slug: "orthopedic-seat-cushion",
    name: "Orthopedic Seat Cushion",
    shortDescription: "Pressure-relief seating for home and office.",
    description:
      "An orthopedic seat cushion designed to reduce pressure during long hours at home or in the office — soft where you sit, stable where you need it.",
    price: 42.0,
    currency: "USD",
    categorySlugs: ["comfort", "all"],
    categoryLabel: "Comfort",
    imageUrl:
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1616628182501-df42145cf54d?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Soft living room comfort seating",
    rating: 4.6,
    reviewCount: 121,
    badges: ["new"],
    features: ["Pressure relief", "Non-slip base", "Machine-washable cover"],
    specs: [
      { label: "Comfort", value: "Pressure-relief foam for long sits" },
      { label: "Base", value: "Non-slip underside for chair stability" },
      { label: "Care", value: "Machine-washable cover" },
      { label: "Place", value: "Home office, desk chair, or travel seat" },
    ],
    inStock: true,
    featured: true,
  },
  {
    id: "prod_007",
    slug: "heated-neck-wrap",
    name: "Heated Neck Wrap",
    shortDescription: "Soft heat therapy for stiff necks and shoulders.",
    description:
      "A plush heated neck wrap that delivers steady warmth where tension collects — evening wind-down without a spa appointment.",
    price: 44.0,
    compareAtPrice: 55.0,
    currency: "USD",
    categorySlugs: ["recovery", "comfort", "all"],
    categoryLabel: "Recovery",
    imageUrl:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Warm spa-like self care moment",
    rating: 4.7,
    reviewCount: 76,
    badges: ["sale"],
    features: ["Even heat zones", "Soft fabric", "Auto shut-off"],
    specs: [
      { label: "Heat", value: "Even heat zones along neck and shoulders" },
      { label: "Fabric", value: "Plush soft surface against skin" },
      { label: "Safety", value: "Auto shut-off for unattended calm" },
      { label: "Ritual", value: "Couch, bed, or post-commute unwind" },
    ],
    inStock: true,
    featured: false,
  },
  {
    id: "prod_008",
    slug: "aluminum-laptop-stand",
    name: "Aluminum Laptop Stand",
    shortDescription: "Elevate your setup. Improve your posture.",
    description:
      "A minimal aluminum laptop stand that raises your screen to a healthier height — cleaner desk lines, better neck posture, less slouch by 5pm.",
    price: 45.0,
    currency: "USD",
    categorySlugs: ["everyday", "all"],
    categoryLabel: "Everyday",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    ],
    imageAlt: "Clean desk setup with elevated laptop",
    rating: 4.8,
    reviewCount: 203,
    badges: ["bestseller"],
    features: ["Solid aluminum", "Ventilated design", "Foldable"],
    specs: [
      { label: "Material", value: "Solid aluminum with clean edges" },
      { label: "Cooling", value: "Ventilated design for airflow" },
      { label: "Portability", value: "Folds flat for travel or storage" },
      { label: "Fit", value: "Most 11–16\" laptops" },
    ],
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

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  const current = getProductBySlug(slug);
  if (!current) return products.slice(0, limit);
  const sameCat = products.filter(
    (p) =>
      p.slug !== slug &&
      p.categorySlugs.some((c) => current.categorySlugs.includes(c) && c !== "all"),
  );
  const rest = products.filter(
    (p) => p.slug !== slug && !sameCat.some((s) => s.id === p.id),
  );
  return [...sameCat, ...rest].slice(0, limit);
}

export function getProductsByCategory(slug: string): Product[] {
  if (slug === "all") return products;
  return products.filter((p) => p.categorySlugs.includes(slug));
}

/** Lightweight catalog search for header autocomplete */
export function searchProducts(query: string, limit = 6): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored = products
    .map((p) => {
      const name = p.name.toLowerCase();
      const cat = (p.categoryLabel ?? "").toLowerCase();
      const short = p.shortDescription.toLowerCase();
      const features = p.features.join(" ").toLowerCase();
      let score = 0;
      if (name === q) score += 100;
      else if (name.startsWith(q)) score += 60;
      else if (name.includes(q)) score += 40;
      if (cat.includes(q)) score += 20;
      if (short.includes(q)) score += 12;
      if (features.includes(q)) score += 8;
      // multi-word: every token must match somewhere
      const tokens = q.split(/\s+/).filter(Boolean);
      if (tokens.length > 1) {
        const hay = `${name} ${cat} ${short} ${features}`;
        if (tokens.every((t) => hay.includes(t))) score += 15;
        else score = 0;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.p);
}
