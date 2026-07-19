export type ProductBadge = "bestseller" | "new" | "limited" | "sale";

export type ProductSpec = {
  label: string;
  value: string;
};

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
  /**
   * Primary cover (kept for convenience).
   * Prefer `images` for carousels — always at least 1 item.
   */
  imageUrl: string;
  /** Gallery for product image carousel (resilient mock → real PDP later) */
  images: string[];
  imageAlt: string;
  rating: number;
  reviewCount: number;
  badges?: ProductBadge[];
  features: string[];
  /** PDP detail rows — Material / Design / Size style */
  specs?: ProductSpec[];
  inStock: boolean;
  featured?: boolean;
  categoryLabel?: string;
}

/** Specs for PDP table; falls back from features when missing */
export function getProductSpecs(product: Product): ProductSpec[] {
  if (product.specs && product.specs.length > 0) return product.specs;
  const labels = ["Design", "Build", "Care", "Detail"];
  return product.features.map((value, i) => ({
    label: labels[i] ?? `Detail ${i + 1}`,
    value,
  }));
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

/** Normalize any product-like object to a non-empty image list. */
export function getProductImages(product: {
  imageUrl?: string;
  images?: string[];
}): string[] {
  const list = (product.images ?? []).filter(Boolean);
  if (list.length > 0) return list;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}
