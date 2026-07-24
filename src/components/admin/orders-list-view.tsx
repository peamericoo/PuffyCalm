"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminOrdersApiError,
  listAdminOrders,
  type AdminOrderListItem,
  type AdminOrderListResponse,
} from "@/lib/api/admin-orders";
import { LIST_STATUS_FILTERS } from "@/lib/admin/order-status";
import { formatDate, formatMoney } from "@/lib/format";

type LoadState =
  | { status: "loading" }
  | { status: "auth_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string; httpStatus?: number }
  | { status: "ok"; data: AdminOrderListResponse };

type Props = {
  googleIdToken?: string | null;
};

const PAGE_SIZE = 24;

function formatWhen(iso: string): string {
  if (!iso) return "-";
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
      const http =
        err.status ?? (e instanceof AdminOrdersApiError ? e.status : undefined);
      if (http === 401 || http === 403) {
        setState({
          status: "auth_error",
          message:
            err.message ||
            (http === 403
              ? "Seu email nao esta autorizado na API."
              : "Sessao do admin expirada."),
          httpStatus: http,
        });
        return;
      }
      setState({
        status: "error",
        message: err.message || "Nao foi possivel carregar os pedidos.",
        httpStatus: http,
      });
    }
  }, [googleIdToken, statusFilter, page]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const onFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/70 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex max-w-xs flex-col gap-1.5 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) => onFilterChange(event.target.value)}
              className="h-11 rounded-md border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
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
            onClick={() => void load()}
            disabled={state.status === "loading"}
          >
            {state.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {state.status === "loading" ? (
        <div
          className="flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-white p-10 text-sm text-muted-foreground shadow-sm"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando pedidos...
        </div>
      ) : null}

      {state.status === "auth_error" ? (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-6 shadow-sm">
          <p className="font-medium text-amber-950">
            Autenticacao necessaria
            {state.httpStatus ? ` (${state.httpStatus})` : ""}
          </p>
          <p className="mt-1 text-sm text-amber-900/80">{state.message}</p>
          <Link
            href="/admin"
            className="mt-3 inline-block text-sm font-medium text-brand-deep hover:underline"
          >
            Abrir inicio do admin
          </Link>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-lg border border-red-200/80 bg-red-50/50 p-6 shadow-sm">
          <p className="font-medium text-red-900">
            Falha ao carregar pedidos
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
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {state.status === "ok" && state.data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-foreground">Nenhum pedido encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter
              ? "Nao ha pedidos com este status."
              : "Quando houver vendas, os pedidos reais aparecerao aqui."}
          </p>
        </div>
      ) : null}

      {state.status === "ok" && state.data.items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm text-muted-foreground">
              <span>
                {state.data.totalItems} pedido
                {state.data.totalItems === 1 ? "" : "s"}
              </span>
              <span>
                Pagina {state.data.page} de {Math.max(state.data.totalPages, 1)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Pedido</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Itens</th>
                    <th className="px-4 py-3 text-right">Acao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {state.data.items.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!state.data.hasPrev}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!state.data.hasNext}
              onClick={() => setPage((value) => value + 1)}
            >
              Proxima
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function OrderRow({ order }: { order: AdminOrderListItem }) {
  return (
    <tr className="hover:bg-muted/25">
      <td className="px-4 py-3">
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-mono font-semibold text-brand-deep hover:underline"
        >
          {order.publicCode || order.id.slice(0, 8)}
        </Link>
        <p className="mt-0.5 max-w-[12rem] truncate font-mono text-[10px] text-muted-foreground">
          {order.id}
        </p>
      </td>
      <td className="max-w-[18rem] truncate px-4 py-3 text-muted-foreground">
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
      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
        {order.itemCount}
      </td>
      <td className="px-4 py-3 text-right">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/orders/${order.id}`}>Abrir</Link>
        </Button>
      </td>
    </tr>
  );
}
