"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProductReviewsPage } from "@/lib/reviews/service";
import type { ReviewSort, ReviewsPage } from "@/types/review";

export type UseProductReviewsArgs = {
  productId: string;
  rating: number;
  reviewCount: number;
  /** Default page size (API-ready). */
  pageSize?: number;
  initialSort?: ReviewSort;
};

export type UseProductReviewsResult = {
  data: ReviewsPage | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  page: number;
  sort: ReviewSort;
  tag: string | null;
  pageSize: number;
  setPage: (page: number) => void;
  setSort: (sort: ReviewSort) => void;
  setTag: (tag: string | null) => void;
  reload: () => void;
};

/**
 * Client data hook for paginated product reviews.
 * Resets to page 1 when sort/tag change; ignores stale responses.
 */
export function useProductReviews({
  productId,
  rating,
  reviewCount,
  pageSize = 4,
  initialSort = "featured",
}: UseProductReviewsArgs): UseProductReviewsResult {
  const [page, setPageState] = useState(1);
  const [sort, setSortState] = useState<ReviewSort>(initialSort);
  const [tag, setTagState] = useState<string | null>(null);
  const [data, setData] = useState<ReviewsPage | null>(null);
  const [status, setStatus] =
    useState<UseProductReviewsResult["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reqId = useRef(0);

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(1, Math.floor(p)));
  }, []);

  const setSort = useCallback((s: ReviewSort) => {
    setSortState(s);
    setPageState(1);
  }, []);

  const setTag = useCallback((t: string | null) => {
    setTagState(t);
    setPageState(1);
  }, []);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const id = ++reqId.current;
    let active = true;
    setStatus("loading");
    setError(null);

    void getProductReviewsPage(
      { productId, page, pageSize, sort, tag },
      { rating, reviewCount },
    )
      .then((pageData) => {
        if (!active || id !== reqId.current) return;
        setData(pageData);
        if (pageData.page !== page) setPageState(pageData.page);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (!active || id !== reqId.current) return;
        setError(err instanceof Error ? err.message : "Could not load reviews");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [productId, page, pageSize, sort, tag, rating, reviewCount, tick]);

  return {
    data,
    status,
    error,
    page,
    sort,
    tag,
    pageSize,
    setPage,
    setSort,
    setTag,
    reload,
  };
}
