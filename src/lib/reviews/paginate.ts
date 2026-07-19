/**
 * Pure pagination helpers — no I/O.
 * Used by mock service today; reusable when the API returns totals only.
 */

export function clampPage(page: number, totalPages: number): number {
  if (!Number.isFinite(page) || page < 1) return 1;
  if (totalPages < 1) return 1;
  return Math.min(Math.floor(page), totalPages);
}

export function normalizePageSize(
  pageSize: number,
  { min = 1, max = 24, fallback = 4 } = {},
): number {
  if (!Number.isFinite(pageSize) || pageSize < min) return fallback;
  return Math.min(Math.floor(pageSize), max);
}

export function pageMeta(
  totalItems: number,
  page: number,
  pageSize: number,
): {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  offset: number;
} {
  const size = normalizePageSize(pageSize);
  const total = Math.max(0, Math.floor(totalItems));
  const totalPages = total === 0 ? 0 : Math.ceil(total / size);
  const safePage = totalPages === 0 ? 1 : clampPage(page, totalPages);
  const offset = (safePage - 1) * size;

  return {
    page: safePage,
    pageSize: size,
    totalItems: total,
    totalPages,
    hasNext: totalPages > 0 && safePage < totalPages,
    hasPrev: safePage > 1,
    offset,
  };
}

/** Window of page numbers with ellipsis markers for UI. */
export function pageWindow(
  current: number,
  totalPages: number,
  siblingCount = 1,
): Array<number | "ellipsis"> {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let i = current - siblingCount; i <= current + siblingCount; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Human range label: "1–4 of 24" */
export function pageRangeLabel(
  page: number,
  pageSize: number,
  totalItems: number,
): string {
  if (totalItems === 0) return "0 of 0";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return `${start}–${end} of ${totalItems}`;
}
