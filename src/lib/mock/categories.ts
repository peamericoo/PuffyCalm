import type { Category } from "@/types/product";

export const categories: Category[] = [
  {
    id: "cat_recovery",
    slug: "recovery",
    name: "Recovery",
    description:
      "Massage, heat, and tension relief for neck, shoulders, and back.",
    tagline: "Unwind after long days",
    imageGradient: "from-sky-100 via-sky-50 to-cream",
    productCount: 4,
  },
  {
    id: "cat_comfort",
    slug: "comfort",
    name: "Comfort",
    description:
      "Supportive cushions and wraps that make sitting and resting better.",
    tagline: "Soft support, all day",
    imageGradient: "from-stone-100 via-cream to-sky-50",
    productCount: 3,
  },
  {
    id: "cat_everyday",
    slug: "everyday",
    name: "Everyday",
    description:
      "Practical upgrades for work, home, and the routines in between.",
    tagline: "Smart little improvements",
    imageGradient: "from-cream via-white to-sky-50",
    productCount: 1,
  },
  {
    id: "cat_all",
    slug: "all",
    name: "All products",
    description: "The full PuffyEasy collection of life-improving essentials.",
    tagline: "Everything we love right now",
    imageGradient: "from-sky-50 via-white to-cream",
    productCount: 8,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
