"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminProductsApiError,
  listAdminProducts,
  type AdminProductListItem,
  type AdminProductListResponse,
} from "@/lib/api/admin-products";
import { LIST_PRODUCT_STATUS_FILTERS } from "@/lib/admin/product-status";
import { ProductStatusBadge } from "@/components/admin/product-status-badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "loading" }
  | { status: "auth_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string; httpStatus?: number }
  | { status: "ok"; data: AdminProductListResponse };

type Props = {
  googleIdToken?: string | null;
};

const PAGE_SIZE = 20;

export function ProductsListView({ googleIdToken }: Props) {
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const data = await listAdminProducts({
        status: statusFilter || undefined,
        q: q || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setState({ status: "ok", data });
    } catch (e) {
      const err = e as Error & { status?: number };
      const http =
        err.status ??
        (e instanceof AdminProductsApiError ? e.status : undefined);
      if (http === 401 || http === 403) {
        setState({
          status: "auth_error",
          message:
            err.message ||
            (http === 403
              ? "Not authorized on the API (ADMIN_EMAILS)."
              : "Backend admin session missing — sign in again."),
          httpStatus: http,
        });
        return;
      }
      setState({
        status: "error",
        message: err.message || "Failed to load products",
        httpStatus: http,
      });
    }
  }, [googleIdToken, statusFilter, q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(qDraft.trim());
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="h-10 rounded-full border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            >
              {LIST_PRODUCT_STATUS_FILTERS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <form onSubmit={onSearch} className="flex gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Search
              </span>
              <input
                value={qDraft}
                onChange={(e) => setQDraft(e.target.value)}
                placeholder="Name, slug, id…"
                className="h-10 w-full min-w-[12rem] rounded-full border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 sm:w-56"
              />
            </label>
            <Button type="submit" variant="outline" size="sm" className="h-10 self-end">
              Search
            </Button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={state.status === "loading"}
          >
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/products/new">New product</Link>
          </Button>
        </div>
      </div>

      {state.status === "loading" && (
        <div
          className="rounded-[1.35rem] border border-border/70 bg-white p-8 text-center text-sm text-muted-foreground shadow-sm"
          role="status"
        >
          Loading products…
        </div>
      )}

      {state.status === "auth_error" && (
        <div className="rounded-[1.35rem] border border-amber-200 bg-amber-50/80 p-6 text-sm shadow-sm">
          <p className="font-medium text-amber-950">Auth required</p>
          <p className="mt-1 text-amber-900/80">{state.message}</p>
          <Link
            href="/admin"
            className="mt-3 inline-block text-sm font-medium text-brand-deep hover:underline"
          >
            Open admin bridge
          </Link>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-[1.35rem] border border-red-200 bg-red-50/80 p-6 text-sm shadow-sm">
          <p className="font-medium text-red-950">Could not load products</p>
          <p className="mt-1 text-red-900/80">{state.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      )}

      {state.status === "ok" && state.data.items.length === 0 && (
        <div className="rounded-[1.35rem] border border-border/70 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium">No products match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a draft, then publish when ready for the storefront.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/admin/products/new">New product</Link>
          </Button>
        </div>
      )}

      {state.status === "ok" && state.data.items.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[1.35rem] border border-border/70 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Categories</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3 text-right">Edit</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {state.data.items.map((p) => (
              <li
                key={p.id}
                className="rounded-[1.25rem] border border-border/70 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl || "/images/placeholder-product.svg"}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover bg-muted"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProductStatusBadge status={p.status} />
                      <span className="text-xs text-muted-foreground">
                        {p.inStock ? "In stock" : "Out"}
                      </span>
                    </div>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="mt-1 block truncate font-medium text-brand-deep hover:underline"
                    >
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.slug}
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatMoney(p.price)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              Page {state.data.page} of {state.data.totalPages} ·{" "}
              {state.data.totalItems} total
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!state.data.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!state.data.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductRow({ product: p }: { product: AdminProductListItem }) {
  return (
    <tr className="border-b border-border/40 last:border-0 hover:bg-muted/20">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl || "/images/placeholder-product.svg"}
            alt=""
            className="h-10 w-10 rounded-lg object-cover bg-muted"
          />
          <div className="min-w-0">
            <Link
              href={`/admin/products/${p.id}`}
              className="font-medium text-brand-deep hover:underline"
            >
              {p.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <ProductStatusBadge status={p.status} />
      </td>
      <td className="px-4 py-3 tabular-nums">{formatMoney(p.price)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {p.categorySlugs.length ? p.categorySlugs.join(", ") : "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "text-xs font-medium",
            p.inStock ? "text-emerald-700" : "text-muted-foreground",
          )}
        >
          {p.inStock ? "In stock" : "Out"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/products/${p.id}`}>Edit</Link>
        </Button>
      </td>
    </tr>
  );
}
