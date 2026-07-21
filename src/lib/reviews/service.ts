/**
 * Product reviews data access facade.
 *
 * Default: FastAPI GET /api/v1/products/{id}/reviews.
 * Rollback: same flag as catalog — `NEXT_PUBLIC_USE_API_CATALOG=0`.
 *
 * UI only consumes `ReviewsPage` — no mock imports in components.
 */

import { isApiCatalogEnabled } from "@/lib/api/config";
import {
  fetchProductReviewsPage,
  ReviewsApiError,
} from "@/lib/api/reviews";
import { getProductReviewsPageMock } from "@/lib/mock/reviews";
import type { ReviewsPage, ReviewsQuery } from "@/types/review";

export type ReviewsServiceContext = {
  /** Catalog average shown on PDP (mock path / fallback display) */
  rating?: number;
  /** Storefront review count (mock path when pool size ≠ marketing count) */
  reviewCount?: number;
};

export class ReviewsFetchError extends Error {
  status: number;
  constructor(status: number, message = "Failed to load reviews") {
    super(message);
    this.name = "ReviewsFetchError";
    this.status = status;
  }
}

/**
 * Paginated product reviews. productId must be stable seed id (prod_00x).
 */
export async function getProductReviewsPage(
  query: ReviewsQuery,
  ctx?: ReviewsServiceContext,
): Promise<ReviewsPage> {
  if (!isApiCatalogEnabled()) {
    return getProductReviewsPageMock(query, {
      rating: ctx?.rating ?? 4.7,
      reviewCount: ctx?.reviewCount ?? 0,
    });
  }

  try {
    return await fetchProductReviewsPage(query);
  } catch (err) {
    if (err instanceof ReviewsApiError) {
      throw new ReviewsFetchError(err.status, err.message);
    }
    throw err;
  }
}

export { ReviewsApiError };
