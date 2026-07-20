"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem } from "@/types/wishlist";

export type WishlistableProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  imageAlt: string;
  currency?: "USD";
  inStock?: boolean;
  categoryLabel?: string;
  rating?: number;
};

interface WishlistState {
  items: WishlistItem[];
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  toggle: (product: WishlistableProduct) => void;
  add: (product: WishlistableProduct) => void;
  remove: (productId: string) => void;
  pin: (productId: string) => void;
  clear: () => void;
  isSaved: (productId: string) => boolean;
}

function toItem(product: WishlistableProduct): WishlistItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    currency: product.currency ?? "USD",
    inStock: product.inStock ?? true,
    categoryLabel: product.categoryLabel,
    rating: product.rating,
    savedAt: new Date().toISOString(),
    pinned: false,
  };
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      toggle: (product) => {
        const exists = get().items.some((i) => i.productId === product.id);
        if (exists) {
          set((s) => ({
            items: s.items.filter((i) => i.productId !== product.id),
          }));
        } else {
          set((s) => ({ items: [toItem(product), ...s.items] }));
        }
      },
      add: (product) => {
        if (get().items.some((i) => i.productId === product.id)) return;
        set((s) => ({ items: [toItem(product), ...s.items] }));
      },
      remove: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),
      pin: (productId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, pinned: !i.pinned } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      isSaved: (productId) =>
        get().items.some((i) => i.productId === productId),
    }),
    {
      name: "puffycalm-wishlist",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useWishlistCount(): number {
  const items = useWishlistStore((s) => s.items);
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  if (!hasHydrated) return 0;
  return items.length;
}

export function useIsWishlisted(productId: string): boolean {
  return useWishlistStore((s) => s.items.some((i) => i.productId === productId));
}

export function sortWishlistItems(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
  });
}
