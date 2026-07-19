/** Shared review domain types — UI + future API contract. */

export type ProductReview = {
  id: string;
  author: string;
  initials: string;
  /** 1–5 */
  rating: number;
  title: string;
  body: string;
  /** Display date, e.g. "Mar 2026" */
  dateLabel: string;
  /** ISO date for stable sorting (API-ready) */
  createdAt: string;
  verified: boolean;
  helpful: number;
  tags?: string[];
  featured?: boolean;
};

export type RatingBreakdown = {
  stars: 1 | 2 | 3 | 4 | 5;
  /** 0–100 share of reviews */
  percent: number;
  count: number;
};

export type ReviewSort = "featured" | "helpful" | "recent";

/** Request shape — same fields a future REST/GraphQL endpoint would accept. */
export type ReviewsQuery = {
  productId: string;
  /** 1-based page index */
  page: number;
  pageSize: number;
  sort: ReviewSort;
  /** Optional topic filter */
  tag?: string | null;
};

export type ReviewsSummary = {
  average: number;
  count: number;
  breakdown: RatingBreakdown[];
  /** Highlight for pull-quote (independent of current page) */
  featured: ProductReview | null;
  /** Distinct tags across the product’s reviews */
  tags: string[];
};

/**
 * Paginated response — designed so the mock layer and a real API
 * return the same shape. UI never pages client-side over “all” reviews.
 */
export type ReviewsPage = {
  items: ProductReview[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  summary: ReviewsSummary;
  /** Echo of the query that produced this page (debugging / sync) */
  query: ReviewsQuery;
};
