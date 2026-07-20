/** Snapshot of a product line at add-time (mock → API later). */
export interface CartLineItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  imageAlt: string;
  currency: "USD";
  quantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  qualifiesForFreeShipping: boolean;
}

/** @deprecated Prefer CartLineItem + store totals — kept for mock fixtures */
export interface Cart {
  items: Array<{ id: string; productId: string; quantity: number }>;
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
}
