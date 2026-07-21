"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminOrdersApiError,
  listAdminOrders,
  type AdminOrderListItem,
  type AdminOrderListResponse,
} from "@/lib/api/admin-orders";
import { LIST_STATUS_FILTERS } from "@/lib/admin/order-status";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "loading" }
  | { status: "auth_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string; httpStatus?: number }
  | { status: "ok"; data: AdminOrderListResponse };

type Props = {
  googleIdToken?: string | null;
};

const PAGE_SIZE = 20;

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return formatDate(iso);
  } catch {
    return iso.slice(0, 10);
  }
}

export function OrdersListView({ googleIdToken }: Props) {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const data = await listAdminOrders({
        status: statusFilter || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setState({ status: "ok", data });
    } catch (e) {
      const err = e as Error & { status?: number };
      const http = err.status ?? (e instanceof AdminOrdersApiError ? e.status : undefined);
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
        message: err.message || "Failed to load orders",
        httpStatus: http,
      });
    }
  }, [googleIdToken, statusFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-10 rounded-full border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          >
            {LIST_STATUS_FILTERS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={state.status === "loading"}
        >
          Refresh
        </Button>
      </div>

      {state.status === "loading" && (
        <div
          className="rounded-[1.35rem] border border-border/70 bg-white p-8 text-center text-sm text-muted-foreground shadow-sm"
          role="status"
        >
          Loading orders from API…
        </div>
      )}

      {state.status === "auth_error" && (
        <div className="rounded-[1.35rem] border border-amber-200/80 bg-amber-50/80 p-6 shadow-sm">
          <p className="font-medium text-amber-950">
            Backend auth required
            {state.httpStatus ? ` (${state.httpStatus})` : ""}
          </p>
          <p className="mt-1 text-sm text-amber-900/80">{state.message}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Open{" "}
            <Link href="/admin" className="font-medium text-brand-deep hover:underline">
              /admin
            </Link>{" "}
            to complete the Google → API bridge, then retry.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-[1.35rem] border border-red-200/80 bg-red-50/50 p-6 shadow-sm">
          <p className="font-medium text-red-900">
            Could not load orders
            {state.httpStatus ? ` (${state.httpStatus})` : ""}
          </p>
          <p className="mt-1 text-sm text-red-800/80">{state.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void load()}
          >
            Retry
          </Button>
        </div>
      )}

      {state.status === "ok" && state.data.items.length === 0 && (
        <div className="rounded-[1.35rem] border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-foreground">No orders found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter
              ? `Nothing with status “${statusFilter}”. Try another filter or clear it.`
              : "When a checkout completes, real orders appear here — no demo data."}
          </p>
        </div>
      )}

      {state.status === "ok" && state.data.items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {state.data.totalItems} order
            {state.data.totalItems === 1 ? "" : "s"}
            {statusFilter ? ` · filtered` : ""} · page {state.data.page} of{" "}
            {Math.max(state.data.totalPages, 1)}
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[1.35rem] border border-border/70 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-[color-mix(in_oklab,var(--background)_50%,white)] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3 text-right">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {state.data.items.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {state.data.items.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-[1.2rem] border border-border/70 bg-white p-4 shadow-sm transition-colors hover:border-brand/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">
                        {order.publicCode || order.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {order.email}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {formatMoney(order.totalCents / 100, order.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatWhen(order.createdAt)} · {order.itemCount} item
                      {order.itemCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {(state.data.hasPrev || state.data.hasNext) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!state.data.hasPrev || state.status !== "ok"}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {state.data.page}
              </span>
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
          )}
        </>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrderListItem }) {
  return (
    <tr className="hover:bg-brand-soft/30">
      <td className="px-4 py-3">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-brand-deep hover:underline"
        >
          {order.publicCode || order.id.slice(0, 8)}
        </Link>
        <p className="mt-0.5 max-w-[10rem] truncate font-mono text-[10px] text-muted-foreground">
          {order.id}
        </p>
      </td>
      <td className="max-w-[12rem] truncate px-4 py-3 text-muted-foreground">
        {order.email}
      </td>
      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">
        {formatMoney(order.totalCents / 100, order.currency)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatWhen(order.createdAt)}
      </td>
      <td className={cn("px-4 py-3 text-right tabular-nums text-muted-foreground")}>
        {order.itemCount}
      </td>
    </tr>
  );
}
