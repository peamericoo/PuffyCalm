"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { ProductStatusBadge } from "@/components/admin/product-status-badge";
import { Button } from "@/components/ui/button";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminProductsApiError,
  listAdminProducts,
  type AdminProductListItem,
  type AdminProductListResponse,
} from "@/lib/api/admin-products";
import { LIST_PRODUCT_STATUS_FILTERS } from "@/lib/admin/product-status";
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

const PAGE_SIZE = 24;

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
              ? "Seu email nao esta autorizado na API."
              : "Sessao do admin expirada."),
          httpStatus: http,
        });
        return;
      }
      setState({
        status: "error",
        message: err.message || "Nao foi possivel carregar os produtos.",
        httpStatus: http,
      });
    }
  }, [googleIdToken, statusFilter, q, page]);

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

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(qDraft.trim());
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/70 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[13rem_minmax(18rem,32rem)]">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="h-11 rounded-md border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              >
                {LIST_PRODUCT_STATUS_FILTERS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <form onSubmit={onSearch} className="flex items-end gap-2">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Busca
                </span>
                <input
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  placeholder="Nome, slug ou id"
                  className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                />
              </label>
              <Button type="submit" variant="outline" className="h-11">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2">
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
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus className="h-4 w-4" />
                Novo produto
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {state.status === "loading" ? (
        <div
          className="flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-white p-10 text-sm text-muted-foreground shadow-sm"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando produtos...
        </div>
      ) : null}

      {state.status === "auth_error" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-6 text-sm shadow-sm">
          <p className="font-medium text-amber-950">
            Autenticacao necessaria
            {state.httpStatus ? ` (${state.httpStatus})` : ""}
          </p>
          <p className="mt-1 text-amber-900/80">{state.message}</p>
          <Link
            href="/admin"
            className="mt-3 inline-block text-sm font-medium text-brand-deep hover:underline"
          >
            Abrir inicio do admin
          </Link>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-lg border border-red-200 bg-red-50/80 p-6 text-sm shadow-sm">
          <p className="font-medium text-red-950">Falha ao carregar produtos</p>
          <p className="mt-1 text-red-900/80">{state.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {state.status === "ok" && state.data.items.length === 0 ? (
        <div className="rounded-lg border border-border/70 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie um rascunho e publique quando estiver pronto.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link href="/admin/products/new">Novo produto</Link>
          </Button>
        </div>
      ) : null}

      {state.status === "ok" && state.data.items.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-sm text-muted-foreground">
              <span>
                {state.data.totalItems} produto
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
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Preco</th>
                    <th className="px-4 py-3">Categorias</th>
                    <th className="px-4 py-3 text-right">Estoque</th>
                    <th className="px-4 py-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {state.data.items.map((product) => (
                    <ProductRow key={product.id} product={product} />
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

function ProductRow({ product }: { product: AdminProductListItem }) {
  return (
    <tr className="hover:bg-muted/25">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl || "/images/placeholder-product.svg"}
            alt=""
            className="h-14 w-14 shrink-0 rounded-md bg-muted object-cover"
          />
          <div className="min-w-0">
            <Link
              href={`/admin/products/${product.id}`}
              className="block truncate font-medium text-brand-deep hover:underline"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {product.id} / {product.slug}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <ProductStatusBadge status={product.status} />
      </td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">
        {formatMoney(product.price)}
      </td>
      <td className="max-w-[18rem] truncate px-4 py-3 text-muted-foreground">
        {product.categorySlugs.length ? product.categorySlugs.join(", ") : "-"}
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
            product.inStock
              ? "bg-emerald-50 text-emerald-800"
              : "bg-zinc-100 text-zinc-700",
          )}
        >
          {product.inStock ? `${product.stockQty ?? "-"} un.` : "Sem estoque"}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          {product.supplierUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={product.supplierUrl} target="_blank" rel="noreferrer" aria-label={`Abrir fornecedor de ${product.name}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                AliExpress
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/products/${product.id}`}>Editar</Link>
          </Button>
        </div>
      </td>
    </tr>
  );
}
