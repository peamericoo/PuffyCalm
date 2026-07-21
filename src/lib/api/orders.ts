/**
 * Customer / guest order APIs (Phase K).
 * Guest: email + public code. Google: list by session email.
 */

import { getApiBaseUrl } from "@/lib/api/config";
import type { OrderItem, OrderResult } from "@/lib/api/checkout";
import { ApiError } from "@/lib/api/checkout";

export type { OrderItem, OrderResult };
export { ApiError };

export type CustomerOrderListItem = {
  id: string;
  publicCode: string;
  email: string;
  status: string;
  currency: "USD";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
  paidAt: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type CustomerOrderListResult = {
  items: CustomerOrderListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  let code = "request_failed";
  try {
    const body = (await res.json()) as {
      detail?: { message?: string; code?: string } | string;
    };
    if (typeof body.detail === "string") {
      message = body.detail;
    } else if (body.detail && typeof body.detail === "object") {
      message = body.detail.message ?? message;
      code = body.detail.code ?? code;
    }
  } catch {
    /* ignore */
  }
  return new ApiError(message, code, res.status);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function parseItem(raw: Record<string, unknown>): OrderItem {
  return {
    productId: asString(raw.productId ?? raw.product_id),
    productSlug: asString(raw.productSlug ?? raw.product_slug),
    productName: asString(raw.productName ?? raw.product_name),
    quantity: asNumber(raw.quantity, 1),
    unitPriceCents: asNumber(raw.unitPriceCents ?? raw.unit_price_cents),
    lineTotalCents: asNumber(raw.lineTotalCents ?? raw.line_total_cents),
    imageUrl: asString(raw.imageUrl ?? raw.image_url),
  };
}

function parseOrder(raw: Record<string, unknown>): OrderResult {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    id: asString(raw.id),
    publicCode: asString(raw.publicCode ?? raw.public_code),
    email: asString(raw.email),
    status: asString(raw.status),
    currency: "USD",
    subtotalCents: asNumber(raw.subtotalCents ?? raw.subtotal_cents),
    shippingCents: asNumber(raw.shippingCents ?? raw.shipping_cents),
    totalCents: asNumber(raw.totalCents ?? raw.total_cents),
    shippingAddress:
      raw.shippingAddress && typeof raw.shippingAddress === "object"
        ? (raw.shippingAddress as Record<string, unknown>)
        : raw.shipping_address && typeof raw.shipping_address === "object"
          ? (raw.shipping_address as Record<string, unknown>)
          : {},
    items: itemsRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map(parseItem),
    paidAt:
      raw.paidAt != null || raw.paid_at != null
        ? asString(raw.paidAt ?? raw.paid_at) || null
        : null,
    createdAt: asString(raw.createdAt ?? raw.created_at),
  };
}

function parseListItem(raw: Record<string, unknown>): CustomerOrderListItem {
  const order = parseOrder(raw);
  return {
    id: order.id,
    publicCode: order.publicCode,
    email: order.email,
    status: order.status,
    currency: "USD",
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    itemCount: asNumber(raw.itemCount ?? raw.item_count, order.items.length),
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    items: order.items,
  };
}

/** GET /api/v1/orders/lookup?email=&code= — guest track by public code */
export async function lookupOrderByCode(
  email: string,
  code: string,
): Promise<OrderResult> {
  const url = new URL(`${getApiBaseUrl()}/api/v1/orders/lookup`);
  url.searchParams.set("email", email.trim());
  url.searchParams.set("code", code.trim());
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  const raw = (await res.json()) as Record<string, unknown>;
  return parseOrder(raw);
}

/** GET /api/v1/orders/by-email?email= — Google-linked my-orders */
export async function listOrdersByEmail(
  email: string,
  options?: { page?: number; pageSize?: number },
): Promise<CustomerOrderListResult> {
  const url = new URL(`${getApiBaseUrl()}/api/v1/orders/by-email`);
  url.searchParams.set("email", email.trim());
  if (options?.page) url.searchParams.set("page", String(options.page));
  if (options?.pageSize) url.searchParams.set("pageSize", String(options.pageSize));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw await parseError(res);
  const raw = (await res.json()) as Record<string, unknown>;
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    items: itemsRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map(parseListItem),
    page: asNumber(raw.page, 1),
    pageSize: asNumber(raw.pageSize ?? raw.page_size, 20),
    totalItems: asNumber(raw.totalItems ?? raw.total_items),
    totalPages: asNumber(raw.totalPages ?? raw.total_pages),
    hasNext: Boolean(raw.hasNext ?? raw.has_next),
    hasPrev: Boolean(raw.hasPrev ?? raw.has_prev),
  };
}
