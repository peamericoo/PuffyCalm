/**
 * Reviews HTTP client — FastAPI GET /api/v1/products/{id}/reviews.
 * Response shape mirrors src/types/review.ts (ReviewsPage).
 */

import { getApiBaseUrl } from "@/lib/api/config";
import type {
  ProductReview,
  RatingBreakdown,
  ReviewSort,
  ReviewsPage,
  ReviewsQuery,
  ReviewsSummary,
} from "@/types/review";

export class ReviewsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "not_found" | "request_failed" | "invalid_response" = "request_failed",
  ) {
    super(message);
    this.name = "ReviewsApiError";
  }
}

const REVIEW_SORTS = new Set<ReviewSort>(["featured", "helpful", "recent"]);

function normalizeReview(raw: Record<string, unknown>): ProductReview {
  const tags = Array.isArray(raw.tags)
    ? (raw.tags as unknown[]).map(String).filter(Boolean)
    : undefined;

  return {
    id: String(raw.id ?? ""),
    author: String(raw.author ?? ""),
    initials: String(raw.initials ?? ""),
    rating: Math.min(5, Math.max(1, Number(raw.rating ?? 0))),
    title: String(raw.title ?? ""),
    body: String(raw.body ?? ""),
    dateLabel: String(raw.dateLabel ?? ""),
    createdAt: String(raw.createdAt ?? ""),
    verified: Boolean(raw.verified),
    helpful: Number(raw.helpful ?? 0),
    tags: tags && tags.length > 0 ? tags : undefined,
    featured: raw.featured == null ? undefined : Boolean(raw.featured),
  };
}

function normalizeBreakdown(raw: unknown): RatingBreakdown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>;
      const stars = Number(r.stars);
      if (stars < 1 || stars > 5) return null;
      return {
        stars: stars as 1 | 2 | 3 | 4 | 5,
        percent: Number(r.percent ?? 0),
        count: Number(r.count ?? 0),
      };
    })
    .filter((x): x is RatingBreakdown => x != null);
}

function normalizeSummary(raw: Record<string, unknown>): ReviewsSummary {
  const featuredRaw = raw.featured;
  const featured =
    featuredRaw && typeof featuredRaw === "object"
      ? normalizeReview(featuredRaw as Record<string, unknown>)
      : null;

  return {
    average: Number(raw.average ?? 0),
    count: Number(raw.count ?? 0),
    breakdown: normalizeBreakdown(raw.breakdown),
    featured,
    tags: Array.isArray(raw.tags)
      ? (raw.tags as unknown[]).map(String).filter(Boolean)
      : [],
  };
}

function normalizeQuery(
  raw: Record<string, unknown>,
  fallback: ReviewsQuery,
): ReviewsQuery {
  const sortRaw = String(raw.sort ?? fallback.sort);
  const sort = REVIEW_SORTS.has(sortRaw as ReviewSort)
    ? (sortRaw as ReviewSort)
    : fallback.sort;
  const tag =
    raw.tag == null || raw.tag === ""
      ? null
      : String(raw.tag);

  return {
    productId: String(raw.productId ?? fallback.productId),
    page: Number(raw.page ?? fallback.page),
    pageSize: Number(raw.pageSize ?? fallback.pageSize),
    sort,
    tag,
  };
}

export function normalizeReviewsPage(
  raw: Record<string, unknown>,
  fallbackQuery: ReviewsQuery,
): ReviewsPage {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const summaryRaw =
    raw.summary && typeof raw.summary === "object"
      ? (raw.summary as Record<string, unknown>)
      : {};
  const queryRaw =
    raw.query && typeof raw.query === "object"
      ? (raw.query as Record<string, unknown>)
      : {};

  return {
    items: itemsRaw.map((r) =>
      normalizeReview(r as Record<string, unknown>),
    ),
    page: Number(raw.page ?? fallbackQuery.page),
    pageSize: Number(raw.pageSize ?? fallbackQuery.pageSize),
    totalItems: Number(raw.totalItems ?? itemsRaw.length),
    totalPages: Number(raw.totalPages ?? 1),
    hasNext: Boolean(raw.hasNext),
    hasPrev: Boolean(raw.hasPrev),
    summary: normalizeSummary(summaryRaw),
    query: normalizeQuery(queryRaw, fallbackQuery),
  };
}

async function parseReviewsError(res: Response): Promise<ReviewsApiError> {
  let message = res.statusText || "Failed to load reviews";
  try {
    const body = (await res.json()) as {
      detail?: string | { message?: string };
    };
    if (typeof body.detail === "string") message = body.detail;
    else if (body.detail && typeof body.detail === "object") {
      message = body.detail.message ?? message;
    }
  } catch {
    /* ignore */
  }
  const code = res.status === 404 ? "not_found" : "request_failed";
  return new ReviewsApiError(message, res.status, code);
}

/**
 * GET /api/v1/products/{productId}/reviews
 * productId is stable seed id (e.g. prod_001), not slug.
 */
export async function fetchProductReviewsPage(
  query: ReviewsQuery,
): Promise<ReviewsPage> {
  const productId = query.productId.trim();
  if (!productId) {
    throw new ReviewsApiError("Missing product id", 400, "invalid_response");
  }

  const qs = new URLSearchParams({
    page: String(Math.max(1, query.page)),
    pageSize: String(Math.min(24, Math.max(1, query.pageSize))),
    sort: query.sort,
  });
  const tag = query.tag?.trim();
  if (tag) qs.set("tag", tag);

  const url = `${getApiBaseUrl()}/api/v1/products/${encodeURIComponent(productId)}/reviews?${qs.toString()}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Client-side pagination — no Next cache tags; avoid stale pages after admin edits later
    cache: "no-store",
  });

  if (!res.ok) throw await parseReviewsError(res);

  const json = (await res.json()) as Record<string, unknown>;
  if (!Array.isArray(json.items) || !json.summary) {
    throw new ReviewsApiError(
      "Invalid reviews response",
      res.status,
      "invalid_response",
    );
  }

  return normalizeReviewsPage(json, {
    ...query,
    productId,
    tag: tag || null,
  });
}
