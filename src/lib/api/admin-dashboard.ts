/**
 * Admin ops dashboard API.
 */

import { getApiBaseUrl } from "@/lib/api/config";

export type DashboardKpis = {
  revenueCentsAllTime: number;
  revenueCents7d: number;
  ordersTotal: number;
  ordersPaidPipeline: number;
  averageOrderCents: number;
  unitsSold: number;
  uniqueBuyers: number;
  fulfillQueueOrders: number;
  fulfillQueueUnits: number;
  openCheckouts: number;
  productsPublished: number;
  productsDraft: number;
  productsArchived: number;
  reviewsTotal: number;
  staffUsers: number;
};

export type DashboardSeriesPoint = {
  date: string;
  orders: number;
  revenueCents: number;
};

export type DashboardOrderCard = {
  id: string;
  publicCode: string;
  email: string;
  status: string;
  totalCents: number;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
};

export type DashboardTopProduct = {
  productId: string;
  name: string;
  slug: string;
  units: number;
  revenueCents: number;
};

export type DashboardData = {
  generatedAt: string;
  rangeDays: number;
  kpis: DashboardKpis;
  ordersByStatus: { status: string; count: number }[];
  series: DashboardSeriesPoint[];
  topProducts: DashboardTopProduct[];
  fulfillmentQueue: DashboardOrderCard[];
  recentOrders: DashboardOrderCard[];
  lowStock: {
    id: string;
    name: string;
    slug: string;
    stockQty: number;
    status: string;
  }[];
};

export class AdminDashboardApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AdminDashboardApiError";
  }
}

function asNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asStr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function mapKpis(raw: Record<string, unknown>): DashboardKpis {
  return {
    revenueCentsAllTime: asNum(raw.revenueCentsAllTime ?? raw.revenue_cents_all_time),
    revenueCents7d: asNum(raw.revenueCents7d ?? raw.revenue_cents_7d),
    ordersTotal: asNum(raw.ordersTotal ?? raw.orders_total),
    ordersPaidPipeline: asNum(
      raw.ordersPaidPipeline ?? raw.orders_paid_pipeline,
    ),
    averageOrderCents: asNum(raw.averageOrderCents ?? raw.average_order_cents),
    unitsSold: asNum(raw.unitsSold ?? raw.units_sold),
    uniqueBuyers: asNum(raw.uniqueBuyers ?? raw.unique_buyers),
    fulfillQueueOrders: asNum(
      raw.fulfillQueueOrders ?? raw.fulfill_queue_orders,
    ),
    fulfillQueueUnits: asNum(raw.fulfillQueueUnits ?? raw.fulfill_queue_units),
    openCheckouts: asNum(raw.openCheckouts ?? raw.open_checkouts),
    productsPublished: asNum(raw.productsPublished ?? raw.products_published),
    productsDraft: asNum(raw.productsDraft ?? raw.products_draft),
    productsArchived: asNum(raw.productsArchived ?? raw.products_archived),
    reviewsTotal: asNum(raw.reviewsTotal ?? raw.reviews_total),
    staffUsers: asNum(raw.staffUsers ?? raw.staff_users),
  };
}

function mapOrder(raw: Record<string, unknown>): DashboardOrderCard {
  return {
    id: asStr(raw.id),
    publicCode: asStr(raw.publicCode ?? raw.public_code),
    email: asStr(raw.email),
    status: asStr(raw.status),
    totalCents: asNum(raw.totalCents ?? raw.total_cents),
    itemCount: asNum(raw.itemCount ?? raw.item_count),
    createdAt: asStr(raw.createdAt ?? raw.created_at),
    paidAt:
      raw.paidAt != null || raw.paid_at != null
        ? asStr(raw.paidAt ?? raw.paid_at) || null
        : null,
  };
}

export async function fetchAdminDashboard(
  days = 30,
): Promise<DashboardData> {
  const url = new URL(`${getApiBaseUrl()}/api/v1/admin/dashboard`);
  url.searchParams.set("days", String(days));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (typeof body.detail === "string") msg = body.detail;
    } catch {
      /* ignore */
    }
    throw new AdminDashboardApiError(msg, res.status);
  }
  const raw = (await res.json()) as Record<string, unknown>;
  const kpisRaw = (raw.kpis ?? {}) as Record<string, unknown>;
  const seriesRaw = Array.isArray(raw.series) ? raw.series : [];
  const statusRaw = Array.isArray(raw.ordersByStatus)
    ? raw.ordersByStatus
    : Array.isArray(raw.orders_by_status)
      ? raw.orders_by_status
      : [];
  const topRaw = Array.isArray(raw.topProducts)
    ? raw.topProducts
    : Array.isArray(raw.top_products)
      ? raw.top_products
      : [];
  const fulfillRaw = Array.isArray(raw.fulfillmentQueue)
    ? raw.fulfillmentQueue
    : Array.isArray(raw.fulfillment_queue)
      ? raw.fulfillment_queue
      : [];
  const recentRaw = Array.isArray(raw.recentOrders)
    ? raw.recentOrders
    : Array.isArray(raw.recent_orders)
      ? raw.recent_orders
      : [];
  const lowRaw = Array.isArray(raw.lowStock)
    ? raw.lowStock
    : Array.isArray(raw.low_stock)
      ? raw.low_stock
      : [];

  return {
    generatedAt: asStr(raw.generatedAt ?? raw.generated_at),
    rangeDays: asNum(raw.rangeDays ?? raw.range_days, 30),
    kpis: mapKpis(kpisRaw),
    ordersByStatus: statusRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        status: asStr(x.status),
        count: asNum(x.count),
      })),
    series: seriesRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        date: asStr(x.date),
        orders: asNum(x.orders),
        revenueCents: asNum(x.revenueCents ?? x.revenue_cents),
      })),
    topProducts: topRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        productId: asStr(x.productId ?? x.product_id),
        name: asStr(x.name),
        slug: asStr(x.slug),
        units: asNum(x.units),
        revenueCents: asNum(x.revenueCents ?? x.revenue_cents),
      })),
    fulfillmentQueue: fulfillRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map(mapOrder),
    recentOrders: recentRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map(mapOrder),
    lowStock: lowRaw
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        id: asStr(x.id),
        name: asStr(x.name),
        slug: asStr(x.slug),
        stockQty: asNum(x.stockQty ?? x.stock_qty),
        status: asStr(x.status),
      })),
  };
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}
