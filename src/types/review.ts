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
