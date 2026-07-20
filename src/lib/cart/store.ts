"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLineItem, CartTotals } from "@/types/cart";
import {
  CART_CURRENCY,
  FLAT_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
  MAX_LINE_QTY,
} from "@/lib/cart/constants";

export type AddableProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  imageAlt: string;
  currency?: "USD";
};

interface CartState {
  items: CartLineItem[];
  isOpen: boolean;
  /** Avoid SSR badge flicker before rehydrate */
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: AddableProduct, quantity?: number) => void;
  /** Add and leave drawer closed (e.g. Buy now → checkout) */
  addItemQuiet: (product: AddableProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

function clampQty(n: number) {
  return Math.max(1, Math.min(MAX_LINE_QTY, Math.floor(n) || 1));
}

function mergeLine(
  items: CartLineItem[],
  product: AddableProduct,
  quantity: number,
): CartLineItem[] {
  const qty = clampQty(quantity);
  const existing = items.find((i) => i.productId === product.id);
  if (existing) {
    return items.map((i) =>
      i.productId === product.id
        ? { ...i, quantity: clampQty(i.quantity + qty) }
        : i,
    );
  }
  const line: CartLineItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
    currency: product.currency ?? CART_CURRENCY,
    quantity: qty,
  };
  return [...items, line];
}

export function computeTotals(items: CartLineItem[]): CartTotals {
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping =
    itemCount === 0 ? 0 : qualifiesForFreeShipping ? 0 : FLAT_SHIPPING;
  const amountToFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal,
  );
  return {
    itemCount,
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: CART_CURRENCY,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountToFreeShipping,
    qualifiesForFreeShipping,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (product, quantity = 1) =>
        set((s) => ({
          items: mergeLine(s.items, product, quantity),
          isOpen: true,
        })),
      addItemQuiet: (product, quantity = 1) =>
        set((s) => ({
          items: mergeLine(s.items, product, quantity),
          isOpen: false,
        })),
      removeItem: (productId) =>
        set((s) => ({
          items: s.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((s) => {
          if (quantity < 1) {
            return {
              items: s.items.filter((i) => i.productId !== productId),
            };
          }
          return {
            items: s.items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: clampQty(quantity) }
                : i,
            ),
          };
        }),
      clearCart: () => set({ items: [], isOpen: false }),
    }),
    {
      name: "puffycalm-cart",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useCartTotals(): CartTotals {
  const items = useCartStore((s) => s.items);
  return computeTotals(items);
}

export function useCartItemCount(): number {
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  if (!hasHydrated) return 0;
  return items.reduce((s, i) => s + i.quantity, 0);
}
