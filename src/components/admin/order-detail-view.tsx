"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminOrdersApiError,
  getAdminOrder,
  patchAdminOrder,
  type AdminOrderDetail,
} from "@/lib/api/admin-orders";
import {
  allowedAdminTargets,
  isTerminalStatus,
  statusLabel,
} from "@/lib/admin/order-status";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "loading" }
  | { status: "auth_error"; message: string; httpStatus?: number }
  | { status: "error"; message: string; httpStatus?: number }
  | { status: "not_found"; message: string }
  | { status: "ok"; order: AdminOrderDetail };

type Props = {
  orderId: string;
  googleIdToken?: string | null;
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    try {
      return formatDate(iso);
    } catch {
      return iso;
    }
  }
}

function shippingLines(addr: Record<string, unknown>): string[] {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = addr[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };
  const lines = [
    [pick("name", "fullName", "full_name"), pick("email")].filter(Boolean).join(" · "),
    pick("line1", "addressLine1", "address1", "street"),
    pick("line2", "addressLine2", "address2"),
    [
      pick("city"),
      pick("state", "region", "province"),
      pick("postalCode", "postal_code", "zip"),
    ]
      .filter(Boolean)
      .join(", "),
    pick("country", "countryCode", "country_code"),
    pick("phone"),
  ].filter(Boolean);
  return lines;
}

export function OrderDetailView({ orderId, googleIdToken }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [statusDraft, setStatusDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setSaveError(null);
    setSaveOk(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const order = await getAdminOrder(orderId);
      setState({ status: "ok", order });
      setStatusDraft("");
      setNotesDraft(order.adminNotes ?? "");
    } catch (e) {
      const err = e as Error & { status?: number };
      const http =
        err.status ?? (e instanceof AdminOrdersApiError ? e.status : undefined);
      if (http === 404) {
        setState({
          status: "not_found",
          message: err.message || "Pedido nao encontrado",
        });
        return;
      }
      if (http === 401 || http === 403) {
        setState({
          status: "auth_error",
          message: err.message || "Sessao do admin expirada",
          httpStatus: http,
        });
        return;
      }
      setState({
        status: "error",
        message: err.message || "Falha ao carregar pedido",
        httpStatus: http,
      });
    }
  }, [googleIdToken, orderId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  const targets = useMemo(() => {
    if (state.status !== "ok") return [] as string[];
    return [...allowedAdminTargets(state.order.status)];
  }, [state]);

  const onSave = async () => {
    if (state.status !== "ok") return;
    const patch: { status?: string; adminNotes?: string | null } = {};
    if (statusDraft && statusDraft !== state.order.status) {
      patch.status = statusDraft;
    }
    const notes = notesDraft.trim();
    const prevNotes = (state.order.adminNotes ?? "").trim();
    if (notes !== prevNotes) {
      patch.adminNotes = notes || null;
    }
    if (Object.keys(patch).length === 0) {
      setSaveError("Nada para salvar. Altere o status ou as notas.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const updated = await patchAdminOrder(orderId, patch);
      setState({ status: "ok", order: updated });
      setStatusDraft("");
      setNotesDraft(updated.adminNotes ?? "");
      setSaveOk("Salvo. Status e notas estao atualizados.");
    } catch (e) {
      const err = e as Error & { status?: number; code?: string };
      const code = e instanceof AdminOrdersApiError ? e.code : err.code;
      setSaveError(
        err.message ||
          (code === "illegal_status_transition"
            ? "Transicao de status nao permitida"
            : "Falha ao atualizar pedido"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (state.status === "loading") {
    return (
      <div
        className="rounded-[1.35rem] border border-border/70 bg-white p-8 text-center text-sm text-muted-foreground shadow-sm"
        role="status"
      >
        Carregando pedido...
      </div>
    );
  }

  if (state.status === "auth_error") {
    return (
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-6 shadow-sm">
        <p className="font-medium text-amber-950">
          Autenticacao necessaria
          {state.httpStatus ? ` (${state.httpStatus})` : ""}
        </p>
        <p className="mt-1 text-sm text-amber-900/80">{state.message}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Abra{" "}
          <Link href="/admin" className="font-medium text-brand-deep hover:underline">
            /admin
          </Link>
          para renovar a sessao e tente novamente.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void load()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (state.status === "not_found") {
    return (
      <div className="rounded-lg border border-border bg-white p-8 text-center shadow-sm">
        <p className="font-medium">Pedido nao encontrado</p>
        <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/admin/orders">Voltar para pedidos</Link>
        </Button>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-red-200/80 bg-red-50/50 p-6 shadow-sm">
        <p className="font-medium text-red-900">
          Falha ao carregar pedido
          {state.httpStatus ? ` (${state.httpStatus})` : ""}
        </p>
        <p className="mt-1 text-sm text-red-800/80">{state.message}</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void load()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const order = state.order;
  const ship = shippingLines(order.shippingAddress);
  const terminal = isTerminalStatus(order.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {order.publicCode || order.id}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{order.id}</p>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">Cliente · </span>
            <a
              href={`mailto:${order.email}`}
              className="font-medium text-brand-deep hover:underline"
            >
              {order.email}
            </a>
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lines */}
        <section className="space-y-3 rounded-lg border border-border/70 bg-white p-4 shadow-sm lg:col-span-2 sm:p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Itens
          </h3>
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item neste pedido.</p>
          ) : (
            <ul className="divide-y divide-border/50">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbs: arbitrary supplier URLs
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Qtd. {item.quantity} ·{" "}
                      {formatMoney(item.unitPriceCents / 100, order.currency)} cada
                    </p>
                    {item.productSlug ? (
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="text-[11px] text-brand-deep hover:underline"
                        target="_blank"
                      >
                        Ver produto
                      </Link>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {formatMoney(item.lineTotalCents / 100, order.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <dl className="space-y-1 border-t border-border/50 pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">
                {formatMoney(order.subtotalCents / 100, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Frete</dt>
              <dd className="tabular-nums">
                {formatMoney(order.shippingCents / 100, order.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">
                {formatMoney(order.totalCents / 100, order.currency)}
              </dd>
            </div>
          </dl>
        </section>

        {/* Side meta + actions */}
        <div className="space-y-4">
          <section className="rounded-lg border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Datas
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Criado</dt>
                <dd>{formatWhen(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Pago</dt>
                <dd>{formatWhen(order.paidAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Atualizado</dt>
                <dd>{formatWhen(order.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Entrega
            </h3>
            {ship.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum endereco salvo.</p>
            ) : (
              <address className="mt-2 not-italic text-sm leading-relaxed">
                {ship.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
            )}
          </section>

          <details className="rounded-lg border border-border/70 bg-white p-4 text-sm shadow-sm sm:p-5">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Detalhes tecnicos
            </summary>
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Stripe Checkout Session</dt>
                <dd className="break-all font-mono">
                  {order.stripeCheckoutSessionId || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Stripe Payment Intent</dt>
                <dd className="break-all font-mono">
                  {order.stripePaymentIntentId || "—"}
                </dd>
              </div>
            </dl>
          </details>

          <section className="rounded-lg border border-border/70 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Atualizar status
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Atual:{" "}
              <span className="font-medium text-foreground">
                {statusLabel(order.status)}
              </span>
              . Pagamento e falha sao controlados pelo webhook.
            </p>

            {terminal ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Status final. Nao ha novas transicoes.
              </p>
            ) : targets.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nao ha transicoes manuais para este status.
              </p>
            ) : (
              <label className="mt-3 block text-sm">
                <span className="sr-only">Novo status</span>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  className="mt-1 h-10 w-full rounded-full border border-border bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                >
                  <option value="">Manter {statusLabel(order.status)}</option>
                  {targets.map((t) => (
                    <option key={t} value={t}>
                      → {statusLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="mt-4 block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notas internas
              </span>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="Observacoes internas, transportadora, reembolso manual..."
                className={cn(
                  "mt-1 w-full resize-y rounded-2xl border border-border bg-white px-3 py-2 text-sm shadow-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
                )}
              />
            </label>

            {saveError ? (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {saveError}
              </p>
            ) : null}
            {saveOk ? (
              <p className="mt-2 text-sm text-emerald-700" role="status">
                {saveOk}
              </p>
            ) : null}

            <Button
              type="button"
              className="mt-4 w-full"
              size="sm"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}
