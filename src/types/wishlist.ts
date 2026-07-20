/** Product snapshot at save-time (works offline / after catalog refresh). */
export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  imageAlt: string;
  currency: "USD";
  inStock: boolean;
  categoryLabel?: string;
  rating?: number;
  /** ISO timestamp when saved */
  savedAt: string;
  /** User pin — floats to top of calm list */
  pinned?: boolean;
}
