/**
 * Product reviews data access facade — FastAPI only (Phase M).
 *
 * GET /api/v1/products/{id}/reviews
 * UI only consumes `ReviewsPage` — no mock imports in components.
 */

import {
  fetchProductReviewsPage,
  ReviewsApiError,
} from "@/lib/api/reviews";
import type { ReviewsPage, ReviewsQuery } from "@/types/review";

export type ReviewsServiceContext = {
  /** Catalog average shown on PDP (optional display context) */
  rating?: number;
  /** Storefront review count (optional display context) */
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
  _ctx?: ReviewsServiceContext,
): Promise<ReviewsPage> {
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
