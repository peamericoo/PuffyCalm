import type { Order } from "@/types/order";

export const mockOrders: Order[] = [
  {
    id: "ord_1001",
    number: "PE-10482",
    status: "shipped",
    placedAt: "2026-07-10T14:22:00.000Z",
    total: 103.0,
    currency: "USD",
    lines: [
      {
        productId: "prod_001",
        productName: "Shiatsu Neck & Shoulder Massager",
        quantity: 1,
        unitPrice: 54,
      },
      {
        productId: "prod_002",
        productName: "Mini Massage Gun",
        quantity: 1,
        unitPrice: 49,
      },
    ],
  },
  {
    id: "ord_1002",
    number: "PE-10391",
    status: "delivered",
    placedAt: "2026-06-28T09:10:00.000Z",
    total: 45.0,
    currency: "USD",
    lines: [
      {
        productId: "prod_008",
        productName: "Aluminum Laptop Stand",
        quantity: 1,
        unitPrice: 45,
      },
    ],
  },
];
