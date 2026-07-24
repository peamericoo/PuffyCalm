/**
 * Admin products API (Phase H).
 * Browser-only: credentials: "include" for FastAPI HttpOnly cookies.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type AdminProductStatus = "draft" | "published" | "archived";

export type AdminProductSpec = {
  label: string;
  value: string;
  sortOrder?: number;
};

export type AdminProductImage = {
  url: string;
  sortOrder?: number;
};

export type AdminProductListItem = {
  id: string;
  slug: string;
  name: string;
  status: AdminProductStatus | string;
  price: number;
  currency: string;
  imageUrl: string;
  /** Internal supplier page; returned only by authenticated Admin endpoints. */
  supplierUrl: string;
  inStock: boolean;
  /** Available units (Phase L). 0 blocks checkout. */
  stockQty?: number;
  featured: boolean;
  categorySlugs: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductDetail = AdminProductListItem & {
  shortDescription: string;
  description: string;
  compareAtPrice: number | null;
  imageAlt: string;
  supplierUrl: string;
  images: AdminProductImage[];
  categoryLabel: string | null;
  badges: string[];
  features: string[];
  specs: AdminProductSpec[];
  maxQuantityPerOrder: number;
  purchaseLimitPerCustomer: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  rating: number;
  reviewCount: number;
};

export type AdminProductListResponse = {
  items: AdminProductListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type AdminProductCreateInput = {
  id?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  imageUrl?: string;
  imageAlt?: string;
  supplierUrl?: string;
  images?: { url: string }[];
  categorySlugs?: string[];
  categoryLabel?: string | null;
  badges?: string[];
  features?: string[];
  specs?: { label: string; value: string }[];
  inStock?: boolean;
  stockQty?: number;
  featured?: boolean;
  status?: AdminProductStatus;
  maxQuantityPerOrder?: number;
  purchaseLimitPerCustomer?: number | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type AdminProductUpdateInput = Partial<AdminProductCreateInput>;

export class AdminProductsApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminProductsApiError";
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
    throw new AdminProductsApiError(
      `Invalid JSON from admin products API (${res.status})`,
      res.status,
    );
  }
}

function errorFromResponse(
  res: Response,
  data: Record<string, unknown>,
): AdminProductsApiError {
  const detail = data.detail;
  if (typeof detail === "string") {
    return new AdminProductsApiError(detail, res.status);
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
    return new AdminProductsApiError(msg, res.status, code);
  }
  // FastAPI 422 validation errors
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    return new AdminProductsApiError(
      first?.msg || `Validation error (${res.status})`,
      res.status,
      "validation_error",
    );
  }
  return new AdminProductsApiError(`HTTP ${res.status}`, res.status);
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function mapListItem(raw: Record<string, unknown>): AdminProductListItem {
  return {
    id: asString(raw.id),
    slug: asString(raw.slug),
    name: asString(raw.name),
    status: asString(raw.status),
    price: asNumber(raw.price),
    currency: asString(raw.currency, "USD"),
    imageUrl: asString(raw.imageUrl ?? raw.image_url),
    supplierUrl: asString(raw.supplierUrl ?? raw.supplier_url),
    inStock: Boolean(raw.inStock ?? raw.in_stock),
    stockQty:
      raw.stockQty != null || raw.stock_qty != null
        ? asNumber(raw.stockQty ?? raw.stock_qty)
        : undefined,
    featured: Boolean(raw.featured),
    categorySlugs: asStringArray(raw.categorySlugs ?? raw.category_slugs),
    publishedAt:
      raw.publishedAt != null || raw.published_at != null
        ? asString(raw.publishedAt ?? raw.published_at)
        : null,
    createdAt: asString(raw.createdAt ?? raw.created_at),
    updatedAt: asString(raw.updatedAt ?? raw.updated_at),
  };
}

function mapDetail(raw: Record<string, unknown>): AdminProductDetail {
  const imagesRaw = Array.isArray(raw.images) ? raw.images : [];
  const specsRaw = Array.isArray(raw.specs) ? raw.specs : [];
  const compareRaw = raw.compareAtPrice ?? raw.compare_at_price;

  return {
    ...mapListItem(raw),
    shortDescription: asString(raw.shortDescription ?? raw.short_description),
    description: asString(raw.description),
    compareAtPrice:
      compareRaw == null || compareRaw === ""
        ? null
        : asNumber(compareRaw),
    imageAlt: asString(raw.imageAlt ?? raw.image_alt),
    supplierUrl: asString(raw.supplierUrl ?? raw.supplier_url),
    images: imagesRaw.map((img) => {
      const i = img as Record<string, unknown>;
      return {
        url: asString(i.url),
        sortOrder: asNumber(i.sortOrder ?? i.sort_order),
      };
    }),
    categoryLabel:
      raw.categoryLabel != null || raw.category_label != null
        ? asString(raw.categoryLabel ?? raw.category_label)
        : null,
    badges: asStringArray(raw.badges),
    features: asStringArray(raw.features),
    specs: specsRaw.map((s) => {
      const row = s as Record<string, unknown>;
      return {
        label: asString(row.label),
        value: asString(row.value),
        sortOrder: asNumber(row.sortOrder ?? row.sort_order),
      };
    }),
    maxQuantityPerOrder: asNumber(
      raw.maxQuantityPerOrder ?? raw.max_quantity_per_order,
      9,
    ),
    purchaseLimitPerCustomer:
      raw.purchaseLimitPerCustomer != null ||
      raw.purchase_limit_per_customer != null
        ? asNumber(
            raw.purchaseLimitPerCustomer ?? raw.purchase_limit_per_customer,
          )
        : null,
    seoTitle:
      raw.seoTitle != null || raw.seo_title != null
        ? asString(raw.seoTitle ?? raw.seo_title)
        : null,
    seoDescription:
      raw.seoDescription != null || raw.seo_description != null
        ? asString(raw.seoDescription ?? raw.seo_description)
        : null,
    rating: asNumber(raw.rating),
    reviewCount: asNumber(raw.reviewCount ?? raw.review_count),
  };
}

export type ListAdminProductsParams = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

/** GET /api/v1/admin/products */
export async function listAdminProducts(
  params: ListAdminProductsParams = {},
): Promise<AdminProductListResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));

  const res = await fetch(apiUrl(`/api/v1/admin/products?${qs.toString()}`), {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
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

/** GET /api/v1/admin/products/{id} */
export async function getAdminProduct(id: string): Promise<AdminProductDetail> {
  const res = await fetch(
    apiUrl(`/api/v1/admin/products/${encodeURIComponent(id)}`),
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}

/** POST /api/v1/admin/products */
export async function createAdminProduct(
  body: AdminProductCreateInput,
): Promise<AdminProductDetail> {
  const res = await fetch(apiUrl("/api/v1/admin/products"), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}

/** PATCH /api/v1/admin/products/{id} */
export async function updateAdminProduct(
  id: string,
  body: AdminProductUpdateInput,
): Promise<AdminProductDetail> {
  const res = await fetch(
    apiUrl(`/api/v1/admin/products/${encodeURIComponent(id)}`),
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}

/** POST /api/v1/admin/products/{id}/publish */
export async function publishAdminProduct(
  id: string,
): Promise<AdminProductDetail> {
  const res = await fetch(
    apiUrl(`/api/v1/admin/products/${encodeURIComponent(id)}/publish`),
    {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}

/** POST /api/v1/admin/products/{id}/unpublish */
export async function unpublishAdminProduct(
  id: string,
): Promise<AdminProductDetail> {
  const res = await fetch(
    apiUrl(`/api/v1/admin/products/${encodeURIComponent(id)}/unpublish`),
    {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    },
  );
  const data = await parseJson(res);
  if (!res.ok) throw errorFromResponse(res, data);
  return mapDetail(data);
}
