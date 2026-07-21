"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Package } from "lucide-react";
import { OrderStatusChip } from "@/components/account/order-status-chip";
import type { CustomerOrderListItem, OrderResult } from "@/lib/api/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type OrderLike = CustomerOrderListItem | OrderResult;

function itemCount(order: OrderLike): number {
  if ("itemCount" in order && typeof order.itemCount === "number") {
    return order.itemCount;
  }
  return order.items.reduce((n, i) => n + i.quantity, 0);
}

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return formatDate(iso);
  } catch {
    return iso.slice(0, 10);
  }
}

function shipLine(addr: Record<string, unknown>): string | null {
  const parts = [
    addr.fullName ?? addr.full_name,
    addr.line1,
    [addr.city, addr.region, addr.postal].filter(Boolean).join(", "),
    addr.country,
  ]
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

type Props = {
  order: OrderLike;
  defaultOpen?: boolean;
};

export function OrderCard({ order, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const count = itemCount(order);
  const shipping =
    "shippingAddress" in order && order.shippingAddress
      ? shipLine(order.shippingAddress)
      : null;

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/95 shadow-[0_16px_40px_-28px_rgb(26_35_50/0.3)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-brand-soft/30 sm:p-5"
        aria-expanded={open}
      >
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
          <Package className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-semibold tracking-tight text-foreground">
              {order.publicCode || order.id.slice(0, 12)}
            </p>
            <OrderStatusChip status={order.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatWhen(order.createdAt)}
            <span className="mx-1.5 text-border">·</span>
            {count} item{count === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
            {formatMoney(order.totalCents / 100, order.currency)}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-border/60 px-4 pb-5 pt-3 sm:px-5">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={`${item.productId}-${item.productSlug}`}
                className="flex gap-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-soft/50">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      —
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity}
                    <span className="mx-1">·</span>
                    {formatMoney(item.unitPriceCents / 100, order.currency)} each
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">
                  {formatMoney(item.lineTotalCents / 100, order.currency)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-border/50 pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">
                {formatMoney(order.subtotalCents / 100, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {order.shippingCents === 0
                  ? "Free"
                  : formatMoney(order.shippingCents / 100, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {formatMoney(order.totalCents / 100, order.currency)}
              </dd>
            </div>
          </dl>

          {shipping ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/80">Ships to: </span>
              {shipping}
            </p>
          ) : null}

          <p className="mt-2 text-[11px] text-muted-foreground">
            Placed with {order.email}
          </p>
        </div>
      ) : null}
    </article>
  );
}
