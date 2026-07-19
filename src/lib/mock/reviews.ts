import { pageMeta } from "@/lib/reviews/paginate";
import type { Product } from "@/types/product";
import type {
  ProductReview,
  RatingBreakdown,
  ReviewSort,
  ReviewsPage,
  ReviewsQuery,
  ReviewsSummary,
} from "@/types/review";

/**
 * Mock review catalog + paginated query adapter.
 * Mirrors a real backend: filter → sort → page, never return the full dump.
 */

type ReviewSeed = Omit<ProductReview, "id" | "createdAt"> & {
  createdAt: string;
};

const SEEDS: ReviewSeed[] = [
  {
    author: "Maya Chen",
    initials: "MC",
    rating: 5,
    title: "Finally something that doesn’t feel clinical",
    body: "I tried two other massagers that looked medical and felt loud. This one sits in my living room without looking weird, and the heat after long screen days is the part I actually look forward to.",
    dateLabel: "Apr 2026",
    createdAt: "2026-04-12T10:00:00.000Z",
    verified: true,
    helpful: 42,
    tags: ["Daily ritual", "Quiet"],
    featured: true,
  },
  {
    author: "Jordan Ellis",
    initials: "JE",
    rating: 5,
    title: "Worth keeping on the desk",
    body: "I keep it draped on the chair. Fifteen minutes between calls and my shoulders stop climbing into my ears. Build quality feels premium without being flashy.",
    dateLabel: "Mar 2026",
    createdAt: "2026-03-28T14:00:00.000Z",
    verified: true,
    helpful: 31,
    tags: ["Desk life"],
  },
  {
    author: "Priya Nair",
    initials: "PN",
    rating: 4,
    title: "Gentle but effective",
    body: "Not the aggressive gym-style tools — more of a calm reset. Heat is optional and I use it most evenings. Would love one more intensity notch for deeper knots.",
    dateLabel: "Mar 2026",
    createdAt: "2026-03-18T09:00:00.000Z",
    verified: true,
    helpful: 18,
    tags: ["Evening wind-down"],
  },
  {
    author: "Sam Ortiz",
    initials: "SO",
    rating: 5,
    title: "Gifted it, then bought my own",
    body: "Sent one to my partner, used theirs once, ordered mine the next day. Packaging was thoughtful and the first session sold me completely.",
    dateLabel: "Feb 2026",
    createdAt: "2026-02-22T16:00:00.000Z",
    verified: true,
    helpful: 27,
    tags: ["Gift", "Instant fan"],
  },
  {
    author: "Alex Rivera",
    initials: "AR",
    rating: 4,
    title: "Travels well, still feels solid",
    body: "Took it on two work trips. Packed flat enough, quiet enough for a hotel, and still feels like a real tool — not a gimmick gadget.",
    dateLabel: "Feb 2026",
    createdAt: "2026-02-08T11:00:00.000Z",
    verified: true,
    helpful: 14,
    tags: ["Travel"],
  },
  {
    author: "Riley Park",
    initials: "RP",
    rating: 5,
    title: "Soft surfaces, serious relief",
    body: "The contact points don’t dig in. After a week of consistent use my afternoon headaches eased. Small thing, huge difference in how the day ends.",
    dateLabel: "Jan 2026",
    createdAt: "2026-01-30T08:00:00.000Z",
    verified: true,
    helpful: 36,
    tags: ["Relief", "Consistent use"],
  },
  {
    author: "Casey Brooks",
    initials: "CB",
    rating: 3,
    title: "Good, not magic",
    body: "Helps with mild tension. If you need deep tissue work, pair it with stretching. Still nicer design than anything else on my shelf.",
    dateLabel: "Jan 2026",
    createdAt: "2026-01-14T19:00:00.000Z",
    verified: false,
    helpful: 9,
    tags: ["Honest take"],
  },
  {
    author: "Noah Kim",
    initials: "NK",
    rating: 5,
    title: "Design matches the calm it creates",
    body: "Usually recovery gear looks industrial. This feels intentional — like it belongs next to good speakers and a clean desk. Performance backs the look up.",
    dateLabel: "Dec 2025",
    createdAt: "2025-12-20T13:00:00.000Z",
    verified: true,
    helpful: 22,
    tags: ["Design", "Calm"],
  },
  {
    author: "Elena Vargas",
    initials: "EV",
    rating: 5,
    title: "Part of my wind-down now",
    body: "I pair it with dim lights and a short stretch. Ten minutes and I’m actually ready to sleep instead of scrolling another hour.",
    dateLabel: "Dec 2025",
    createdAt: "2025-12-05T21:00:00.000Z",
    verified: true,
    helpful: 19,
    tags: ["Evening wind-down", "Daily ritual"],
  },
  {
    author: "Chris Holt",
    initials: "CH",
    rating: 4,
    title: "Quiet enough for shared space",
    body: "Apartment walls are thin. This doesn’t announce itself. Effectiveness surprised me for how soft it feels on first use.",
    dateLabel: "Nov 2025",
    createdAt: "2025-11-18T10:00:00.000Z",
    verified: true,
    helpful: 11,
    tags: ["Quiet"],
  },
  {
    author: "Ava Brooks",
    initials: "AB",
    rating: 5,
    title: "Better than I expected for the price",
    body: "Skeptical of recovery gadgets. This one earned a permanent spot. Heat + compression is the combo that works for my screen eyes and neck.",
    dateLabel: "Nov 2025",
    createdAt: "2025-11-02T15:00:00.000Z",
    verified: true,
    helpful: 25,
    tags: ["Relief", "Worth it"],
  },
  {
    author: "Leo Martins",
    initials: "LM",
    rating: 4,
    title: "Solid daily driver",
    body: "Not flashy. Does what it claims. I use it after long coding blocks and notice less tightness by evening.",
    dateLabel: "Oct 2025",
    createdAt: "2025-10-21T12:00:00.000Z",
    verified: true,
    helpful: 13,
    tags: ["Desk life", "Daily ritual"],
  },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Expand seeds into a product-scoped catalog (enough for multi-page demos). */
function buildCatalog(productId: string, catalogRating: number): ProductReview[] {
  const seed = hashSeed(productId);
  const offset = seed % SEEDS.length;

  // 2 full rotations with slight id/helpful variance → ~24 items
  const out: ProductReview[] = [];
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < SEEDS.length; i++) {
      const src = SEEDS[(i + offset) % SEEDS.length]!;
      const idx = round * SEEDS.length + i;
      let rating = src.rating;
      if (catalogRating >= 4.7 && rating < 4 && idx < 8) {
        rating = Math.min(5, rating + 1);
      }
      out.push({
        ...src,
        rating,
        id: `${productId}_rev_${idx}`,
        featured: idx === 0,
        helpful: src.helpful + ((seed + idx) % 7),
        // Stagger dates slightly per round so “recent” sort differs
        createdAt: new Date(
          Date.parse(src.createdAt) - round * 86_400_000 * 40 - idx * 3_600_000,
        ).toISOString(),
        dateLabel: src.dateLabel,
      });
    }
  }
  return out;
}

function sortReviews(list: ProductReview[], sort: ReviewSort): ProductReview[] {
  const copy = [...list];
  switch (sort) {
    case "helpful":
      return copy.sort((a, b) => b.helpful - a.helpful || b.rating - a.rating);
    case "recent":
      return copy.sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
    case "featured":
    default:
      return copy.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          b.helpful - a.helpful ||
          b.rating - a.rating,
      );
  }
}

function uniqueTags(reviews: ProductReview[], limit = 6): string[] {
  const tags: string[] = [];
  for (const r of reviews) {
    for (const t of r.tags ?? []) {
      if (!tags.includes(t)) tags.push(t);
      if (tags.length >= limit) return tags;
    }
  }
  return tags;
}

function breakdownFrom(
  reviews: ProductReview[],
  fallbackAverage: number,
  fallbackCount: number,
): RatingBreakdown[] {
  const total = reviews.length || fallbackCount || 1;
  const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  if (reviews.length === 0) {
    // Mirror catalog score when empty catalog edge case
    const r = fallbackAverage;
    let weights: [number, number, number, number, number];
    if (r >= 4.8) weights = [72, 18, 6, 3, 1];
    else if (r >= 4.6) weights = [62, 24, 8, 4, 2];
    else weights = [48, 28, 14, 7, 3];
    const sumW = weights.reduce((a, b) => a + b, 0);
    return ([5, 4, 3, 2, 1] as const).map((stars, i) => {
      const percent = Math.round((weights[i]! / sumW) * 100);
      return {
        stars,
        percent,
        count: Math.round((percent / 100) * fallbackCount),
      };
    });
  }

  for (const r of reviews) {
    const s = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    counts[s] += 1;
  }

  return ([5, 4, 3, 2, 1] as const).map((stars) => {
    const count = counts[stars];
    const percent = Math.round((count / total) * 100);
    return { stars, percent, count };
  });
}

export type ProductReviewContext = {
  productId: string;
  /** Catalog average (shown even if mock pool size ≠ reviewCount) */
  rating: number;
  reviewCount: number;
};

/**
 * Paginated mock endpoint. Prefer this over dumping all reviews to the client.
 */
export async function getProductReviewsPageMock(
  query: ReviewsQuery,
  ctx?: Pick<ProductReviewContext, "rating" | "reviewCount">,
): Promise<ReviewsPage> {
  const rating = ctx?.rating ?? 4.7;
  const reviewCount = ctx?.reviewCount ?? 0;

  const catalog = buildCatalog(query.productId, rating);
  const tag = query.tag?.trim() || null;

  let filtered = catalog;
  if (tag) {
    filtered = catalog.filter((r) => r.tags?.includes(tag));
  }

  const sorted = sortReviews(filtered, query.sort);
  const meta = pageMeta(sorted.length, query.page, query.pageSize);
  const items = sorted.slice(meta.offset, meta.offset + meta.pageSize);

  const featured =
    catalog.find((r) => r.featured) ??
    sortReviews(catalog, "helpful")[0] ??
    null;

  const summary: ReviewsSummary = {
    average: rating,
    // Prefer storefront-facing count when provided
    count: reviewCount > 0 ? reviewCount : catalog.length,
    breakdown: breakdownFrom(catalog, rating, reviewCount),
    featured,
    tags: uniqueTags(catalog),
  };

  // Light async boundary so UI loading states are real
  await new Promise((r) => setTimeout(r, 0));

  return {
    items,
    page: meta.page,
    pageSize: meta.pageSize,
    totalItems: meta.totalItems,
    totalPages: meta.totalPages,
    hasNext: meta.hasNext,
    hasPrev: meta.hasPrev,
    summary,
    query: {
      ...query,
      page: meta.page,
      pageSize: meta.pageSize,
      tag,
    },
  };
}

/** @deprecated Prefer getProductReviewsPage — kept for any stray imports */
export function getReviewsForProduct(
  product: Product,
  limit = 6,
): ProductReview[] {
  const catalog = buildCatalog(product.id, product.rating);
  return catalog.slice(0, limit);
}

export function getRatingBreakdown(product: Product): RatingBreakdown[] {
  return breakdownFrom(
    buildCatalog(product.id, product.rating),
    product.rating,
    product.reviewCount,
  );
}

export function getReviewHighlights(reviews: ProductReview[]): string[] {
  return uniqueTags(reviews);
}
