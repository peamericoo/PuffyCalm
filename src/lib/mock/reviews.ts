import type { Product } from "@/types/product";
import type { ProductReview, RatingBreakdown } from "@/types/review";

/**
 * Review fixtures + per-product assembly.
 * Deterministic from product id so ratings stay coherent with catalog scores.
 */

const POOL: Omit<ProductReview, "id">[] = [
  {
    author: "Maya Chen",
    initials: "MC",
    rating: 5,
    title: "Finally something that doesn’t feel clinical",
    body: "I tried two other massagers that looked medical and felt loud. This one sits in my living room without looking weird, and the heat after long screen days is the part I actually look forward to.",
    dateLabel: "Apr 2026",
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
    verified: true,
    helpful: 22,
    tags: ["Design", "Calm"],
  },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Stable rotation of pool items for a product. */
export function getReviewsForProduct(product: Product, limit = 6): ProductReview[] {
  const seed = hashSeed(product.id);
  const rotated = [...POOL];
  const offset = seed % rotated.length;
  const ordered = [...rotated.slice(offset), ...rotated.slice(0, offset)];

  // Bias ratings toward the product’s catalog score
  const target = product.rating;
  return ordered.slice(0, limit).map((r, i) => {
    let rating = r.rating;
    if (target >= 4.7 && rating < 4 && i < 4) rating = Math.min(5, rating + 1);
    if (target < 4.6 && i === 2) rating = Math.max(3, rating - 1);
    return {
      ...r,
      rating,
      id: `${product.id}_rev_${i}`,
      featured: i === 0,
    };
  });
}

/** Distribution that sums ~100 and mirrors product.rating. */
export function getRatingBreakdown(
  product: Product,
): RatingBreakdown[] {
  const total = Math.max(product.reviewCount, 1);
  const r = product.rating;

  // Heavier top end when rating is high
  let weights: [number, number, number, number, number];
  if (r >= 4.8) weights = [72, 18, 6, 3, 1];
  else if (r >= 4.6) weights = [62, 24, 8, 4, 2];
  else if (r >= 4.3) weights = [48, 28, 14, 7, 3];
  else weights = [35, 30, 18, 12, 5];

  const sumW = weights.reduce((a, b) => a + b, 0);
  const rows: RatingBreakdown[] = ([5, 4, 3, 2, 1] as const).map((stars, i) => {
    const percent = Math.round((weights[i]! / sumW) * 100);
    const count = Math.round((percent / 100) * total);
    return { stars, percent, count };
  });

  // Fix percent sum drift
  const pSum = rows.reduce((a, b) => a + b.percent, 0);
  if (pSum !== 100 && rows[0]) {
    rows[0] = {
      ...rows[0],
      percent: rows[0].percent + (100 - pSum),
    };
  }

  return rows;
}

export function getReviewHighlights(reviews: ProductReview[]): string[] {
  const tags = reviews.flatMap((r) => r.tags ?? []);
  const unique: string[] = [];
  for (const t of tags) {
    if (!unique.includes(t)) unique.push(t);
    if (unique.length >= 5) break;
  }
  return unique;
}
