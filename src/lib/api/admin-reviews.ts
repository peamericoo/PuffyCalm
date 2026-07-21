/**
 * Admin product reviews API.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type AdminReview = {
  id: string;
  productId: string;
  author: string;
  initials: string;
  rating: number;
  title: string;
  body: string;
  dateLabel: string;
  verified: boolean;
  helpful: number;
  tags: string[];
  featured: boolean;
  createdAt: string;
};

export type AdminReviewCreate = {
  author: string;
  initials?: string;
  rating: number;
  title?: string;
  body: string;
  dateLabel?: string;
  verified?: boolean;
  tags?: string[];
  featured?: boolean;
};

export class AdminReviewsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "AdminReviewsApiError";
  }
}

async function parseError(res: Response): Promise<AdminReviewsApiError> {
  let message = `HTTP ${res.status}`;
  let code: string | undefined;
  try {
    const data = (await res.json()) as {
      detail?: string | { message?: string; code?: string };
    };
    if (typeof data.detail === "string") message = data.detail;
    else if (data.detail && typeof data.detail === "object") {
      message = data.detail.message || message;
      code = data.detail.code;
    }
  } catch {
    /* ignore */
  }
  return new AdminReviewsApiError(message, res.status, code);
}

function mapReview(raw: Record<string, unknown>): AdminReview {
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((t): t is string => typeof t === "string")
    : [];
  return {
    id: String(raw.id ?? ""),
    productId: String(raw.productId ?? raw.product_id ?? ""),
    author: String(raw.author ?? ""),
    initials: String(raw.initials ?? ""),
    rating: Number(raw.rating ?? 0),
    title: String(raw.title ?? ""),
    body: String(raw.body ?? ""),
    dateLabel: String(raw.dateLabel ?? raw.date_label ?? ""),
    verified: Boolean(raw.verified),
    helpful: Number(raw.helpful ?? 0),
    tags,
    featured: Boolean(raw.featured),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  };
}

export async function fetchAdminProductReviews(
  productId: string,
): Promise<AdminReview[]> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/admin/products/${encodeURIComponent(productId)}/reviews`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    },
  );
  if (!res.ok) throw await parseError(res);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map(mapReview);
}

export async function createAdminProductReview(
  productId: string,
  input: AdminReviewCreate,
): Promise<AdminReview> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/admin/products/${encodeURIComponent(productId)}/reviews`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) throw await parseError(res);
  return mapReview((await res.json()) as Record<string, unknown>);
}

export async function deleteAdminReview(reviewId: string): Promise<void> {
  const res = await fetch(
    `${getApiBaseUrl()}/api/v1/admin/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      credentials: "include",
    },
  );
  if (!res.ok) throw await parseError(res);
}
