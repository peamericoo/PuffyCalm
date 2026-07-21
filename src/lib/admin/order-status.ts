/**
 * Mirrors backend/app/domain/order_rules.py for admin UI.
 * Payment promotions (→ paid / → failed) are webhook-only — not in ADMIN_TRANSITIONS.
 */

import type { AdminOrderStatus } from "@/lib/api/admin-orders";

export const ALL_ORDER_STATUSES: readonly AdminOrderStatus[] = [
  "pending",
  "requires_payment",
  "paid",
  "failed",
  "cancelled",
  "processing",
  "shipped",
  "delivered",
] as const;

/** Admin-allowed edges (from → targets). Terminal = empty. */
export const ADMIN_TRANSITIONS: Record<string, readonly string[]> = {
  pending: ["cancelled"],
  requires_payment: ["cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  failed: ["cancelled"],
  delivered: [],
  cancelled: [],
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  requires_payment: "Requires payment",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

/** Tailwind classes for status pills (admin only). */
export const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-50 text-amber-900 ring-amber-200/80",
  requires_payment: "bg-orange-50 text-orange-900 ring-orange-200/80",
  paid: "bg-emerald-50 text-emerald-900 ring-emerald-200/80",
  failed: "bg-red-50 text-red-900 ring-red-200/80",
  cancelled: "bg-zinc-100 text-zinc-700 ring-zinc-200/80",
  processing: "bg-sky-50 text-sky-900 ring-sky-200/80",
  shipped: "bg-indigo-50 text-indigo-900 ring-indigo-200/80",
  delivered: "bg-brand-soft text-brand-deep ring-brand/20",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusPillClass(status: string): string {
  return STATUS_PILL[status] ?? "bg-zinc-50 text-zinc-700 ring-zinc-200/80";
}

export function allowedAdminTargets(fromStatus: string): readonly string[] {
  return ADMIN_TRANSITIONS[fromStatus] ?? [];
}

export function isTerminalStatus(status: string): boolean {
  return status === "delivered" || status === "cancelled";
}

/** Filter options for list (empty string = all). */
export const LIST_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  ...ALL_ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
];
