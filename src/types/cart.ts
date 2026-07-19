export interface CartLineItem {
  id: string;
  productId: string;
  quantity: number;
}

export interface Cart {
  items: CartLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: "USD";
}
