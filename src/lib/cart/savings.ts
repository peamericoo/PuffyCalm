import type { CartLineItem } from "@/types/cart";

/** Aggregate sale savings across bag lines. */
export function computeCartSavings(items: CartLineItem[]): number {
  return items.reduce((sum, item) => {
    if (item.compareAtPrice && item.compareAtPrice > item.price) {
      return sum + (item.compareAtPrice - item.price) * item.quantity;
    }
    return sum;
  }, 0);
}

export function lineSavings(item: CartLineItem): number {
  if (!item.compareAtPrice || item.compareAtPrice <= item.price) return 0;
  return (item.compareAtPrice - item.price) * item.quantity;
}

export function lineOffPercent(item: CartLineItem): number {
  if (!item.compareAtPrice || item.compareAtPrice <= item.price) return 0;
  return Math.round(
    ((item.compareAtPrice - item.price) / item.compareAtPrice) * 100,
  );
}
