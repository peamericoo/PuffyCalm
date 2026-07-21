/**
 * Admin orders API (Phase F endpoints, Phase G UI).
 * Browser-only: credentials: "include" for FastAPI HttpOnly cookies.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type AdminOrderStatus =
  | "pending"
  | "requires_payment"
  | "paid"
  | "failed"
  | "cancelled"
  | "processing"
  | "shipped"
  | "delivered";

export type AdminOrderListItem = {
  id: string;
  publicCode: string;
  email: string;
  status: AdminOrderStatus | string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderItem = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  imageUrl: string;
};

export type AdminOrderDetail = AdminOrderListItem & {
  shippingAddress: Record<string, unknown>;
  adminNotes: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  items: AdminOrderItem[];
};

export type AdminOrderListResponse = {
  items: AdminOrderListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type AdminOrderPatch = {
  status?: AdminOrderStatus | string;
  adminNotes?: string | null;
};

export class AdminOrdersApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminOrdersApiError";
    this.status = status;
    this.code = code;
  }
}

function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new AdminOrdersApiError(
      `Invalid JSON from admin orders API (${res.status})`,
      res.status,
    );
  }
}

function errorFromResponse(
  res: Response,
  data: Record<string, unknown>,
): AdminOrdersApiError {
  const detail = data.detail;
  if (typeof detail === "string") {
    return new AdminOrdersApiError(detail, res.status);
  }
  if (detail && typeof detail === "object") {
    const d = detail as Record<string, unknown>;
    const msg =
      typeof d.message === "string"
        ? d.message
        : typeof d.detail === "string"
          ? d.detail
          : `HTTP ${res.status}`;
    const code = typeof d.code === "string" ? d.code : undefined;
    return new AdminOrdersApiError(msg, res.status, code);
  }
  return new AdminOrdersApiError(`HTTP ${res.status}`, res.status);
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function mapListItem(raw: Record<string, unknown>): AdminOrderListItem {
  return {
    id: asString(raw.id),
    publicCode: asString(raw.publicCode ?? raw.public_code),
    email: asString(raw.email),
    status: asString(raw.status),
    currency: asString(raw.currency, "USD"),
    subtotalCents: asNumber(raw.subtotalCents ?? raw.subtotal_cents),
    shippingCents: asNumber(raw.shippingCents ?? raw.shipping_cents),
    totalCents: asNumber(raw.totalCents ?? raw.total_cents),
    itemCount: asNumber(raw.itemCount ?? raw.item_count),
    paidAt:
      raw.paidAt != null || raw.paid_at != null
        ? asString(raw.paidAt ?? raw.paid_at)
        : null,
    createdAt: asString(raw.createdAt ?? raw.created_at),
    updatedAt: asString(raw.updatedAt ?? raw.updated_at),
  };
}

function mapItem(raw: Record<string, unknown>): AdminOrderItem {
  return {
    id: asString(raw.id),
    productId: asString(raw.productId ?? raw.product_id),
    productSlug: asString(raw.productSlug ?? raw.product_slug),
    productName: asString(raw.productName ?? raw.product_name),
    quantity: asNumber(raw.quantity, 1),
    unitPriceCents: asNumber(raw.unitPriceCents ?? raw.unit_price_cents),
    lineTotalCents: asNumber(raw.lineTotalCents ?? raw.line_total_cents),
    imageUrl: asString(raw.imageUrl ?? raw.image_url),
  };
}

function mapDetail(raw: Record<string, unknown>): AdminOrderDetail {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const shipping =
    raw.shippingAddress && typeof raw.shippingAddress === "object"
      ? (raw.shippingAddress as Record<string, unknown>)
      : raw.shipping_address && typeof raw.shipping_address === "object"
        ? (raw.shipping_address as Record<string, unknown>)
        : {};

  return {
    ...mapListItem(raw),
    shippingAddress: shipping,
    adminNotes:
      raw.adminNotes != null || raw.admin_notes != null
        ? asString(raw.adminNotes ?? raw.admin_notes)
        : null,
    stripeCheckoutSessionId:
      raw.stripeCheckoutSessionId != null ||
      raw.stripe_checkout_session_id != null
        ? asString(raw.stripeCheckoutSessionId ?? raw.stripe_checkout_session_id)
        : null,
    stripePaymentIntentId:
      raw.stripePaymentIntentId != null || raw.stripe_payment_intent_id != null
        ? asString(raw.stripePaymentIntentId ?? raw.stripe_payment_intent_id)
        : null,
    items: itemsRaw.map((i) => mapItem(i as Record<string, unknown>)),
  };
}

export type ListAdminOrdersParams = {
  status?: string;
  page?: number;
  pageSize?: number;
};

/** GET /api/v1/admin/orders */
export async function listAdminOrders(
  params: ListAdminOrdersParams = {},
): Promise<AdminOrderListResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));

  const res = await fetch(
    apiUrl(`/api/v1/admin/orders?${qs.toString()}`),
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  return {
    items: itemsRaw.map((i) => mapListItem(i as Record<string, unknown>)),
    page: asNumber(data.page, 1),
    pageSize: asNumber(data.pageSize ?? data.page_size, 20),
    totalItems: asNumber(data.totalItems ?? data.total_items),
    totalPages: asNumber(data.totalPages ?? data.total_pages, 1),
    hasNext: Boolean(data.hasNext ?? data.has_next),
    hasPrev: Boolean(data.hasPrev ?? data.has_prev),
  };
}

/** GET /api/v1/admin/orders/{id} */
export async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  const res = await fetch(apiUrl(`/api/v1/admin/orders/${encodeURIComponent(id)}`), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}

/** PATCH /api/v1/admin/orders/{id} */
export async function patchAdminOrder(
  id: string,
  body: AdminOrderPatch,
): Promise<AdminOrderDetail> {
  const payload: Record<string, unknown> = {};
  if (body.status !== undefined) payload.status = body.status;
  if (body.adminNotes !== undefined) payload.adminNotes = body.adminNotes;

  const res = await fetch(
    apiUrl(`/api/v1/admin/orders/${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}
