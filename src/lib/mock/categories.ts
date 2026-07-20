import type { Category } from "@/types/product";

export const categories: Category[] = [
  {
    id: "cat_recovery",
    slug: "recovery",
    name: "Recovery",
    description:
      "Massage, heat, and tension relief that helps you reset after long days.",
    tagline: "Unwind tension. Move freer.",
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Shop Recovery",
    productCount: 4,
  },
  {
    id: "cat_comfort",
    slug: "comfort",
    name: "Comfort",
    description:
      "Supportive cushions and wraps that make sitting and resting feel better.",
    tagline: "Soft support for real life.",
    imageUrl:
      "https://images.unsplash.com/photo-1616628182501-df42145cf54d?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Shop Comfort",
    productCount: 3,
  },
  {
    id: "cat_everyday",
    slug: "everyday",
    name: "Everyday",
    description:
      "Practical upgrades for work, home, and the routines in between.",
    tagline: "Small upgrades. Better days.",
    imageUrl:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Shop Everyday",
    productCount: 1,
  },
  {
    id: "cat_all",
    slug: "all",
    name: "All products",
    description: "The full PuffyCalm collection of life-improving essentials.",
    tagline: "Everything we love right now",
    imageUrl:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
    ctaLabel: "Shop All",
    productCount: 8,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
