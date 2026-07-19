import { getProductReviewsPageMock } from "@/lib/mock/reviews";
import type { ReviewsPage, ReviewsQuery } from "@/types/review";

export type ReviewsServiceContext = {
  /** Catalog average shown on PDP */
  rating?: number;
  /** Storefront review count (may exceed mock pool size) */
  reviewCount?: number;
};

/**
 * Product reviews data access.
 *
 * Today: mock with the same `ReviewsPage` contract a real API will return.
 * Tomorrow: replace the body with `fetch('/api/products/.../reviews')`.
 * UI components only consume `ReviewsPage` — no mock imports in components.
 */
export async function getProductReviewsPage(
  query: ReviewsQuery,
  ctx?: ReviewsServiceContext,
): Promise<ReviewsPage> {
  // Future API:
  // const params = new URLSearchParams({
  //   page: String(query.page),
  //   pageSize: String(query.pageSize),
  //   sort: query.sort,
  //   ...(query.tag ? { tag: query.tag } : {}),
  // });
  // const res = await fetch(`/api/products/${query.productId}/reviews?${params}`);
  // if (!res.ok) throw new ReviewsFetchError(res.status);
  // return res.json() as Promise<ReviewsPage>;

  return getProductReviewsPageMock(query, {
    rating: ctx?.rating ?? 4.7,
    reviewCount: ctx?.reviewCount ?? 0,
  });
}

export class ReviewsFetchError extends Error {
  status: number;
  constructor(status: number, message = "Failed to load reviews") {
    super(message);
    this.name = "ReviewsFetchError";
    this.status = status;
  }
}
