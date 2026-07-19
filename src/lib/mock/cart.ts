import type { Cart } from "@/types/cart";
import { products } from "./products";

/** Mock cart for visual storefront (not persisted). */
export const mockCart: Cart = {
  items: [
    { id: "line_1", productId: "prod_001", quantity: 1 },
    { id: "line_2", productId: "prod_002", quantity: 1 },
  ],
  subtotal: 103,
  shipping: 0,
  total: 103,
  currency: "USD",
};

export function getMockCartItemCount(): number {
  return mockCart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartProducts() {
  return mockCart.items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean);
}
