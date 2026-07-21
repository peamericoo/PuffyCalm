"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Boxes,
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  Users,
} from "lucide-react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import { AdminBackendBridge } from "@/components/admin/admin-backend-bridge";
import {
  AdminDashboardApiError,
  fetchAdminDashboard,
  formatUsdFromCents,
  type DashboardData,
} from "@/lib/api/admin-dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  googleIdToken?: string | null;
  operatorName?: string | null;
  operatorEmail?: string | null;
  role?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#94a3b8",
  requires_payment: "#f59e0b",
  paid: "#3d9b7a",
  processing: "#2a5f82",
  shipped: "#6366f1",
  delivered: "#0f766e",
  failed: "#ef4444",
  cancelled: "#a1a1aa",
};

const CHART_RANGES = [
  { days: 7, label: "7d" },
  { days: 14, label: "14d" },
  { days: 30, label: "30d" },
  { days: 90, label: "90d" },
] as const;

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "good" | "brand";
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "rounded-[1.25rem] border p-4 shadow-sm transition",
        tone === "warn" && "border-amber-200 bg-amber-50/80",
        tone === "good" && "border-emerald-200 bg-emerald-50/70",
        tone === "brand" && "border-brand/25 bg-brand-soft/50",
        tone === "default" && "border-border/70 bg-white",
        href && "hover:border-brand-deep/40 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <span className="rounded-full bg-white/80 p-1.5 text-brand-deep shadow-sm ring-1 ring-border/50">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
      style={{ backgroundColor: STATUS_COLORS[status] ?? "#64748b" }}
    >
      {status.replace(/_/g, " ")}
    </span>
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
            : "Failed to load dashboard";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [days, googleIdToken]);

  useEffect(() => {
    setLoading(true);
    void load();
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
      (data?.series ?? []).map((p) => ({
        ...p,
        revenue: (p.revenueCents || 0) / 100,
        label: p.date.slice(5),
      })),
    [data?.series],
  );

  const pieData = useMemo(
    () =>
      (data?.ordersByStatus ?? []).map((s) => ({
        name: s.status,
        value: s.count,
        fill: STATUS_COLORS[s.status] ?? "#94a3b8",
      })),
    [data?.ordersByStatus],
  );

  const k = data?.kpis;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-3 py-6 sm:px-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Ops · {role ?? "staff"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {operatorName ? `Hey, ${operatorName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Sales, fulfillment queue, catalog health — live from Postgres.
            {operatorEmail ? (
              <>
                {" "}
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {operatorEmail}
                </span>
                .
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-border bg-white p-0.5 shadow-sm">
            {CHART_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  days === r.days
                    ? "bg-brand-deep text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(autoRefresh && "border-brand/40 bg-brand-soft/40")}
            onClick={() => setAutoRefresh((v) => !v)}
          >
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            {autoRefresh ? "Live 45s" : "Paused"}
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
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <AdminBackendBridge
        className="!mt-0"
        googleIdToken={googleIdToken}
      />

      {error ? (
        <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
          <span className="mt-1 block text-xs text-muted-foreground">
            If this is 401, complete the backend bridge above, then Refresh.
          </span>
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading ops metrics…
        </div>
      ) : null}

      {k ? (
        <>
          {/* KPI grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Revenue (all time)"
              value={formatUsdFromCents(k.revenueCentsAllTime)}
              hint={`${formatUsdFromCents(k.revenueCents7d)} in last 7 days`}
              icon={DollarSign}
              tone="good"
              href="/admin/orders"
            />
            <KpiCard
              label="Paid pipeline"
              value={String(k.ordersPaidPipeline)}
              hint={`AOV ${formatUsdFromCents(k.averageOrderCents)} · ${k.unitsSold} units`}
              icon={ShoppingBag}
              tone="brand"
              href="/admin/orders"
            />
            <KpiCard
              label="To fulfill"
              value={String(k.fulfillQueueOrders)}
              hint={`${k.fulfillQueueUnits} units · paid + processing`}
              icon={Truck}
              tone={k.fulfillQueueOrders > 0 ? "warn" : "default"}
              href="/admin/orders"
            />
            <KpiCard
              label="Buyers"
              value={String(k.uniqueBuyers)}
              hint={`${k.openCheckouts} open checkouts · ${k.ordersTotal} total orders`}
              icon={Users}
            />
            <KpiCard
              label="Catalog live"
              value={String(k.productsPublished)}
              hint={`${k.productsDraft} draft · ${k.productsArchived} archived`}
              icon={Package}
              href="/admin/products"
            />
            <KpiCard
              label="Units sold"
              value={String(k.unitsSold)}
              hint="Across paid → delivered"
              icon={Boxes}
            />
            <KpiCard
              label="Reviews"
              value={String(k.reviewsTotal)}
              hint="On product PDPs"
              icon={Activity}
            />
            <KpiCard
              label="Open checkouts"
              value={String(k.openCheckouts)}
              hint="Pending / requires payment"
              icon={AlertTriangle}
              tone={k.openCheckouts > 5 ? "warn" : "default"}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm lg:col-span-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-semibold">
                    Revenue & orders
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Last {data?.rangeDays ?? days} days · hover for detail
                  </p>
                </div>
              </div>
              <div className="h-64 w-full min-w-0 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#2a5f82"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2a5f82"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="rev"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                      width={48}
                    />
                    <YAxis
                      yAxisId="ord"
                      orientation="right"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                      formatter={(value, name) => {
                        const n = typeof value === "number" ? value : Number(value);
                        if (name === "revenue")
                          return [
                            formatUsdFromCents(Math.round(n * 100)),
                            "Revenue",
                          ];
                        return [n, "Orders"];
                      }}
                    />
                    <Area
                      yAxisId="rev"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#2a5f82"
                      fill="url(#revFill)"
                      strokeWidth={2}
                      name="revenue"
                    />
                    <Bar
                      yAxisId="ord"
                      dataKey="orders"
                      fill="#94a3b8"
                      opacity={0.55}
                      radius={[4, 4, 0, 0]}
                      name="orders"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm lg:col-span-2">
              <h2 className="font-display text-base font-semibold">
                Order funnel
              </h2>
              <p className="text-xs text-muted-foreground">
                Count by status (all time)
              </p>
              <div className="mt-2 h-56 w-full min-w-0 sm:h-64">
                {pieData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No orders yet — charts fill as sales happen.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          value ?? 0,
                          String(name ?? "").replace(/_/g, " "),
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <ul className="mt-1 flex flex-wrap gap-2">
                {pieData.map((s) => (
                  <li
                    key={s.name}
                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.fill }}
                    />
                    {s.name.replace(/_/g, " ")} ({s.value})
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top products bar */}
          <div className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm">
            <h2 className="font-display text-base font-semibold">
              Top products by units
            </h2>
            <p className="text-xs text-muted-foreground">
              Dropshipping signal — what to restock / rebuy first
            </p>
            <div className="mt-3 h-56 w-full min-w-0">
              {(data?.topProducts.length ?? 0) === 0 ? (
                <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No paid sales yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data!.topProducts.map((p) => ({
                      name:
                        p.name.length > 18
                          ? `${p.name.slice(0, 16)}…`
                          : p.name,
                      units: p.units,
                      revenue: p.revenueCents / 100,
                    }))}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        const n = typeof value === "number" ? value : Number(value);
                        if (name === "revenue")
                          return [formatUsdFromCents(Math.round(n * 100)), "Revenue"];
                        return [n, "Units"];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="units" fill="#2a5f82" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Queues */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold">
                    Fulfillment queue
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Paid / processing — buy & ship
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/orders">All orders</Link>
                </Button>
              </div>
              {(data?.fulfillmentQueue.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Queue clear — no paid orders waiting.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {data!.fulfillmentQueue.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold text-brand-deep">
                            {o.publicCode}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {o.email} · {o.itemCount} units
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <StatusBadge status={o.status} />
                          <p className="mt-1 text-xs font-medium">
                            {formatUsdFromCents(o.totalCents)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold">
                    Live order feed
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Newest activity
                    {lastOk
                      ? ` · updated ${lastOk.toLocaleTimeString()}`
                      : null}
                  </p>
                </div>
              </div>
              {(data?.recentOrders.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No orders in the database yet.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {data!.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-semibold">
                            {o.publicCode}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {o.email}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <StatusBadge status={o.status} />
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {o.createdAt
                              ? new Date(o.createdAt).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Low stock */}
          <section className="rounded-[1.35rem] border border-border/70 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold">
                  Low stock (≤5)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Published SKUs to rebuy for dropshipping
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/products">Products</Link>
              </Button>
            </div>
            {(data?.lowStock.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No low-stock published products (or catalog empty).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-semibold">Product</th>
                      <th className="py-2 pr-3 font-semibold">Slug</th>
                      <th className="py-2 font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.lowStock.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="py-2 pr-3">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-medium text-brand-deep hover:underline"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                          {p.slug}
                        </td>
                        <td className="py-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              p.stockQty <= 0
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900",
                            )}
                          >
                            {p.stockQty}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2 pb-8">
            <Button asChild>
              <Link href="/admin/products/new">New product</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/content">Content</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/categories">Categories</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">View storefront</Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
