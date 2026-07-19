export type ProductBadge = "bestseller" | "new" | "limited" | "sale";

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD";
  categorySlugs: string[];
  imageGradient: string;
  imageEmoji: string;
  rating: number;
  reviewCount: number;
  badges?: ProductBadge[];
  features: string[];
  inStock: boolean;
  featured?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string;
  imageGradient: string;
  productCount: number;
}
