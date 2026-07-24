"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminDashboardApiError,
  fetchAdminDashboard,
  formatUsdFromCents,
  type DashboardData,
  type DashboardOrderCard,
} from "@/lib/api/admin-dashboard";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
  operatorName?: string | null;
  operatorEmail?: string | null;
  role?: string | null;
};

const CHART_RANGES = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
] as const;

function KpiCard({
  label,
  value,
  detail,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  tone?: "default" | "attention";
}) {
  const card = (
    <div
      className={cn(
        "h-full rounded-lg border bg-white p-5 shadow-sm transition-colors",
        tone === "attention"
          ? "border-amber-300 bg-amber-50/70"
          : "border-border/70",
        href && "hover:border-brand-deep/40",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-snug text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

function OrderList({
  title,
  items,
  empty,
}: {
  title: string;
  items: DashboardOrderCard[];
  empty: string;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">Ver pedidos</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {items.slice(0, 6).map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="grid gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/30 lg:grid-cols-[8rem_minmax(0,1fr)_9rem_7rem]"
              >
                <span className="font-mono font-semibold text-brand-deep">
                  {order.publicCode || order.id.slice(0, 8)}
                </span>
                <span className="truncate text-muted-foreground">
                  {order.email}
                </span>
                <OrderStatusBadge status={order.status} />
                <span className="text-right font-medium tabular-nums">
                  {formatUsdFromCents(order.totalCents)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminDashboardView({
  googleIdToken,
  operatorName,
  operatorEmail,
  role,
}: Props) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastOk, setLastOk] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const dash = await fetchAdminDashboard(days);
      setData(dash);
      setLastOk(new Date());
    } catch (e) {
      const msg =
        e instanceof AdminDashboardApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Nao foi possivel carregar o painel.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [days, googleIdToken]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLoading(true);
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void load();
    }, 45_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  const revenueSeries = useMemo(
    () =>
      (data?.series ?? []).map((point) => ({
        ...point,
        receita: (point.revenueCents || 0) / 100,
        label: point.date.slice(5),
      })),
    [data?.series],
  );

  const k = data?.kpis;
  const firstName = operatorName?.split(" ")[0] || "Admin";

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {role === "admin" ? "Administrador" : "Equipe"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Bom trabalho, {firstName}
          </h1>
          {operatorEmail ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Sessao ativa em {operatorEmail}.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border bg-white p-1 shadow-sm">
            {CHART_RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => setDays(range.days)}
                className={cn(
                  "rounded px-3 py-2 text-sm font-medium transition-colors",
                  days === range.days
                    ? "bg-foreground text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((value) => !value)}
          >
            {autoRefresh ? "Atualizacao 45s" : "Atualizacao pausada"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
          <span className="mt-1 block text-xs text-muted-foreground">
            Se for uma falha de sessao, entre novamente no Google e atualize.
          </span>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-white py-24 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando painel...
        </div>
      ) : null}

      {k ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <KpiCard
              label="Receita"
              value={formatUsdFromCents(k.revenueCentsAllTime)}
              detail={`${formatUsdFromCents(k.revenueCents7d)} nos ultimos 7 dias`}
              href="/admin/orders"
            />
            <KpiCard
              label="Pedidos pagos"
              value={String(k.ordersPaidPipeline)}
              detail={`${k.unitsSold} unidades vendidas`}
              href="/admin/orders"
            />
            <KpiCard
              label="A preparar"
              value={String(k.fulfillQueueOrders)}
              detail={`${k.fulfillQueueUnits} unidades aguardando acao`}
              href="/admin/orders"
              tone={k.fulfillQueueOrders > 0 ? "attention" : "default"}
            />
            <KpiCard
              label="Produtos publicados"
              value={String(k.productsPublished)}
              detail={`${k.productsDraft} rascunhos`}
              href="/admin/products"
            />
            <KpiCard
              label="Checkouts abertos"
              value={String(k.openCheckouts)}
              detail={`${k.ordersTotal} pedidos no total`}
              tone={k.openCheckouts > 5 ? "attention" : "default"}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.65fr)]">
            <section className="rounded-lg border border-border/70 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Receita e pedidos</h2>
                  <p className="text-sm text-muted-foreground">
                    Periodo selecionado: {data?.rangeDays ?? days} dias.
                  </p>
                </div>
              </div>
              <div className="h-[22rem] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2a5f82" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2a5f82" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis
                      yAxisId="receita"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                      width={56}
                    />
                    <YAxis
                      yAxisId="pedidos"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => {
                        const numberValue =
                          typeof value === "number" ? value : Number(value);
                        if (name === "receita") {
                          return [
                            formatUsdFromCents(Math.round(numberValue * 100)),
                            "Receita",
                          ];
                        }
                        return [numberValue, "Pedidos"];
                      }}
                    />
                    <Area
                      yAxisId="receita"
                      type="monotone"
                      dataKey="receita"
                      stroke="#2a5f82"
                      fill="url(#adminRevenueFill)"
                      strokeWidth={2}
                      name="receita"
                    />
                    <Bar
                      yAxisId="pedidos"
                      dataKey="orders"
                      fill="#94a3b8"
                      opacity={0.6}
                      radius={[4, 4, 0, 0]}
                      name="pedidos"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-white shadow-sm">
              <div className="border-b border-border/60 px-5 py-4">
                <h2 className="text-lg font-semibold">Atalhos</h2>
              </div>
              <div className="grid gap-3 p-5">
                <Button asChild className="justify-start">
                  <Link href="/admin/products/new">
                    <Package className="h-4 w-4" />
                    Novo produto
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/admin/orders">
                    <Truck className="h-4 w-4" />
                    Ver pedidos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <Link href="/admin/products">
                    <ShoppingBag className="h-4 w-4" />
                    Ver produtos
                  </Link>
                </Button>
              </div>
              <div className="border-t border-border/60 px-5 py-4 text-sm text-muted-foreground">
                Ultima leitura: {lastOk ? lastOk.toLocaleTimeString("pt-BR") : "-"}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <OrderList
              title="Pedidos para preparar"
              items={data?.fulfillmentQueue ?? []}
              empty="Nenhum pedido pago aguardando preparo."
            />
            <OrderList
              title="Pedidos recentes"
              items={data?.recentOrders ?? []}
              empty="Ainda nao ha pedidos."
            />
          </div>

          <section className="rounded-lg border border-border/70 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold">Estoque baixo</h2>
                <p className="text-sm text-muted-foreground">
                  Produtos publicados com 5 unidades ou menos.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/products">Abrir produtos</Link>
              </Button>
            </div>
            {(data?.lowStock.length ?? 0) === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhum produto publicado com estoque baixo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">Produto</th>
                      <th className="px-5 py-3">Slug</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data!.lowStock.map((product) => (
                      <tr key={product.id}>
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="font-medium text-brand-deep hover:underline"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {product.slug}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {product.status}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
                              product.stockQty <= 0
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900",
                            )}
                          >
                            {product.stockQty}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
