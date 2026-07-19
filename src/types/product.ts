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
  /** Lifestyle / product photography URL */
  imageUrl: string;
  imageAlt: string;
  rating: number;
  reviewCount: number;
  badges?: ProductBadge[];
  features: string[];
  inStock: boolean;
  featured?: boolean;
  categoryLabel?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  tagline: string;
  imageUrl: string;
  ctaLabel: string;
  productCount: number;
}
