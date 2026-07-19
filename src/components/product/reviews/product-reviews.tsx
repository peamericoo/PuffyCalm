"use client";

import { ReviewFeed } from "@/components/product/reviews/review-feed";
import { ReviewFilters } from "@/components/product/reviews/review-filters";
import { ReviewPagination } from "@/components/product/reviews/review-pagination";
import { ReviewSummary } from "@/components/product/reviews/review-summary";
import { useProductReviews } from "@/lib/hooks/use-product-reviews";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductReviewsProps {
  product: Product;
  /** Items per page — API-ready default */
  pageSize?: number;
  className?: string;
}

/**
 * Product reviews section (orchestrator).
 * Data via `useProductReviews` → `getProductReviewsPage` service.
 * Swap the service to a real API without changing this tree.
 */
export function ProductReviews({
  product,
  pageSize = 4,
  className,
}: ProductReviewsProps) {
  const {
    data,
    status,
    error,
    page,
    sort,
    tag,
    setPage,
    setSort,
    setTag,
    reload,
  } = useProductReviews({
    productId: product.id,
    rating: product.rating,
    reviewCount: product.reviewCount,
    pageSize,
  });

  const loading = status === "loading" || status === "idle";
  const summary = data?.summary;
  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.totalItems ?? 0;

  const highlightFirst =
    page === 1 && sort === "featured" && !tag && items[0]?.featured;

  return (
    <section
      id="reviews"
      aria-labelledby="product-reviews-heading"
      className={cn("scroll-mt-28", className)}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Social proof
          </p>
          <h2
            id="product-reviews-heading"
            className="mt-1 font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl"
          >
            What owners say
          </h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">
            {(summary?.count ?? product.reviewCount).toLocaleString()}
          </span>{" "}
          reviews · real orders
        </p>
      </div>

      <ReviewSummary
        average={summary?.average ?? product.rating}
        count={summary?.count ?? product.reviewCount}
        breakdown={summary?.breakdown ?? []}
        featured={summary?.featured ?? null}
      />

      <ReviewFilters
        className="mt-5 sm:mt-6"
        sort={sort}
        tag={tag}
        tags={summary?.tags ?? []}
        onSortChange={setSort}
        onTagChange={setTag}
      />

      {error ? (
        <div className="mt-5 border border-border/80 bg-white p-6 text-center">
          <p className="text-[14px] text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 text-[13px] font-semibold text-brand-deep hover:text-foreground"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 sm:mt-6">
            <ReviewFeed
              items={items}
              highlightFirst={Boolean(highlightFirst)}
              loading={loading}
              empty={!loading && items.length === 0}
            />
          </div>

          <ReviewPagination
            className="mt-2"
            page={data?.page ?? page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={data?.pageSize ?? pageSize}
            onPageChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </section>
  );
}
