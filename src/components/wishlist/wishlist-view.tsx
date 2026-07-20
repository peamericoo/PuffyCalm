"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Pin,
  ShoppingBag,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart/store";
import { getFeaturedProducts } from "@/lib/mock/products";
import {
  sortWishlistItems,
  useWishlistStore,
} from "@/lib/wishlist/store";
import { formatMoney } from "@/lib/format";
import type { WishlistItem } from "@/types/wishlist";
import { cn } from "@/lib/utils";
import styles from "./wishlist.module.css";

type Filter = "all" | "sale" | "stock" | "pinned";

const PAGE_SIZE = 6;

function isOnSale(item: WishlistItem) {
  return Boolean(item.compareAtPrice && item.compareAtPrice > item.price);
}

/**
 * Wishlist page — uniform cards, fluid filter transitions, pagination.
 */
export function WishlistView() {
  const router = useRouter();
  const rawItems = useWishlistStore((s) => s.items);
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  const remove = useWishlistStore((s) => s.remove);
  const pin = useWishlistStore((s) => s.pin);
  const clear = useWishlistStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const addItemQuiet = useCartStore((s) => s.addItemQuiet);

  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [listKey, setListKey] = useState(0);
  const [movedId, setMovedId] = useState<string | null>(null);

  const items = useMemo(() => sortWishlistItems(rawItems), [rawItems]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "sale":
        return items.filter(isOnSale);
      case "stock":
        return items.filter((i) => i.inStock);
      case "pinned":
        return items.filter((i) => i.pinned);
      default:
        return items;
    }
  }, [items, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const totalValue = items.reduce((s, i) => s + i.price, 0);
  const savings = items.reduce((s, i) => {
    if (i.compareAtPrice && i.compareAtPrice > i.price) {
      return s + (i.compareAtPrice - i.price);
    }
    return s;
  }, 0);
  const inStockCount = items.filter((i) => i.inStock).length;

  const suggestions = useMemo(
    () =>
      getFeaturedProducts()
        .filter((p) => !items.some((i) => i.productId === p.id))
        .slice(0, 4),
    [items],
  );

  const toCartProduct = (item: WishlistItem) => ({
    id: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    compareAtPrice: item.compareAtPrice,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    currency: item.currency,
  });

  const moveToBag = (item: WishlistItem) => {
    if (!item.inStock) return;
    addItem(toCartProduct(item), 1);
    setMovedId(item.productId);
    window.setTimeout(() => setMovedId(null), 1400);
  };

  const buyNow = (item: WishlistItem) => {
    if (!item.inStock) return;
    addItemQuiet(toCartProduct(item), 1);
    router.push("/checkout");
  };

  const addAllToBag = () => {
    items.filter((i) => i.inStock).forEach((item) => addItem(toCartProduct(item), 1));
  };

  const changeFilter = (next: Filter) => {
    if (next === filter) return;
    setFilter(next);
    setPage(1);
    setListKey((k) => k + 1);
  };

  const goPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped === safePage) return;
    setPage(clamped);
    setListKey((k) => k + 1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!hasHydrated) {
    return (
      <section className="px-3 py-16 sm:px-5">
        <Container className="max-w-lg text-center text-sm text-muted-foreground">
          Loading your list…
        </Container>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section
        className={cn(styles.heroGlow, "px-3 pb-20 pt-6 sm:px-5 sm:pb-24 sm:pt-8")}
      >
        <Container className="animate-fade-up">
          <EmptyWishlist suggestions={suggestions} />
        </Container>
      </section>
    );
  }

  return (
    <section
      className={cn(
        styles.heroGlow,
        "px-3 pb-20 pt-5 sm:px-5 sm:pb-24 sm:pt-7",
      )}
    >
      <Container className="animate-fade-up max-w-[1100px]">
        {/* Clean header — no Calm list / Share noise */}
        <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-[1.55rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
              Saved for your real days
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground sm:text-[14px]">
              {items.length} piece{items.length === 1 ? "" : "s"}
              {totalValue > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney(totalValue)}
                  </span>
                </>
              ) : null}
              {savings > 0 ? (
                <>
                  {" "}
                  · save up to{" "}
                  <span className="font-semibold text-brand-deep">
                    {formatMoney(savings)}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          {inStockCount > 0 ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="pressable shrink-0 self-start sm:self-auto"
              onClick={addAllToBag}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add all to bag
            </Button>
          ) : null}
        </header>

        {/* Filters */}
        <div
          className="mb-5 flex flex-wrap gap-1.5 sm:mb-6"
          role="tablist"
          aria-label="Filter saved items"
        >
          {(
            [
              { id: "all" as const, label: "All" },
              { id: "pinned" as const, label: "Pinned" },
              { id: "sale" as const, label: "On sale" },
              { id: "stock" as const, label: "In stock" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => changeFilter(f.id)}
              className={cn(
                styles.filterPill,
                "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold",
                filter === f.id
                  ? "bg-brand-deep text-white shadow-sm"
                  : "bg-white/90 text-muted-foreground ring-1 ring-border/70 hover:bg-brand-soft hover:text-brand-deep",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div
            key={listKey}
            className={cn(
              styles.gridEnter,
              "rounded-[1.25rem] border border-border/70 bg-white/90 px-5 py-12 text-center shadow-sm",
            )}
          >
            <p className="text-[15px] font-semibold text-foreground">
              Nothing in this filter
            </p>
            <button
              type="button"
              className="mt-2 text-[13px] font-semibold text-brand-deep"
              onClick={() => changeFilter("all")}
            >
              Show all
            </button>
          </div>
        ) : (
          <>
            <div
              key={`${listKey}-${safePage}`}
              className={cn(
                styles.gridEnter,
                "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3",
              )}
            >
              {pageItems.map((item, i) => (
                <WishlistCard
                  key={item.productId}
                  item={item}
                  index={i}
                  onRemove={() => remove(item.productId)}
                  onPin={() => pin(item.productId)}
                  onBag={() => moveToBag(item)}
                  onBuy={() => buyNow(item)}
                  justMoved={movedId === item.productId}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 ? (
              <nav
                className="mt-8 flex flex-wrap items-center justify-center gap-2"
                aria-label="Wishlist pages"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full px-0"
                  disabled={safePage <= 1}
                  onClick={() => goPage(safePage - 1)}
                  aria-label="Previous page"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => goPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === safePage ? "page" : undefined}
                        className={cn(
                          styles.filterPill,
                          "flex h-10 min-w-10 items-center justify-center rounded-full px-2.5 text-[13px] font-semibold",
                          p === safePage
                            ? "bg-brand-deep text-white shadow-sm"
                            : "bg-white text-muted-foreground ring-1 ring-border/70 hover:bg-brand-soft hover:text-brand-deep",
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 rounded-full px-0"
                  disabled={safePage >= totalPages}
                  onClick={() => goPage(safePage + 1)}
                  aria-label="Next page"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="w-full text-center text-[12px] text-muted-foreground sm:w-auto sm:pl-2">
                  {safePage} of {totalPages}
                  <span className="mx-1 opacity-40">·</span>
                  {filtered.length} items
                </p>
              </nav>
            ) : (
              <p className="mt-6 text-center text-[12px] text-muted-foreground">
                {filtered.length} item{filtered.length === 1 ? "" : "s"}
              </p>
            )}
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-5">
          <Button asChild variant="outline" size="sm">
            <Link href="/category/all">
              Keep browsing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear your entire list?")) clear();
            }}
            className="text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-cta"
          >
            Clear list
          </button>
        </div>
      </Container>
    </section>
  );
}

function EmptyWishlist({
  suggestions,
}: {
  suggestions: ReturnType<typeof getFeaturedProducts>;
}) {
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className={cn(
          styles.heartBurst,
          "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cta/10 text-cta ring-1 ring-cta/20",
        )}
      >
        <Heart className="h-7 w-7" strokeWidth={1.7} />
      </span>
      <h1 className="mt-5 font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
        Nothing saved yet
      </h1>
      <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
        Tap the heart on anything you love — we’ll keep it here until you’re
        ready.
      </p>
      <Button asChild variant="default" className="pressable mt-7">
        <Link href="/category/all">
          Explore the shop
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      {suggestions.length > 0 ? (
        <div className="mt-12 text-left">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand-deep" />
            Start with these
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {suggestions.map((p) => (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm ring-1 ring-white/70"
              >
                <Link
                  href={`/product/${p.slug}`}
                  className="relative block aspect-[4/5] overflow-hidden"
                >
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="160px"
                  />
                </Link>
                <div className="flex items-start justify-between gap-1 p-2.5">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold tabular-nums text-brand-deep">
                      {formatMoney(p.price, p.currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Save ${p.name}`}
                    onClick={() => toggle(p)}
                    className="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-cta"
                  >
                    <Heart className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function WishlistCard({
  item,
  index,
  onRemove,
  onPin,
  onBag,
  onBuy,
  justMoved,
}: {
  item: WishlistItem;
  index: number;
  onRemove: () => void;
  onPin: () => void;
  onBag: () => void;
  onBuy: () => void;
  justMoved: boolean;
}) {
  const sale = isOnSale(item);

  return (
    <article
      className={cn(
        styles.itemIn,
        "flex h-full flex-col overflow-hidden rounded-[1.2rem] border border-border/70 bg-white shadow-sm ring-1 ring-white/70",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="relative aspect-[4/3.4] overflow-hidden bg-brand-soft">
        <Link href={`/product/${item.slug}`} className="absolute inset-0 block">
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
            fill
            className="object-cover transition-transform duration-500 hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <div className="flex flex-wrap gap-1">
            {sale ? (
              <span className="rounded-full bg-brand-deep px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                Sale
              </span>
            ) : null}
            {item.pinned ? (
              <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
                Pinned
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onPin}
            aria-label={item.pinned ? "Unpin" : "Pin"}
            className={cn(
              "pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors",
              item.pinned
                ? "bg-brand-soft text-brand-deep ring-1 ring-brand/20"
                : "bg-white/95 text-muted-foreground ring-1 ring-border/50 hover:text-brand-deep",
            )}
          >
            <Pin
              className={cn("h-3.5 w-3.5", item.pinned && "fill-current")}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
        {item.categoryLabel ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {item.categoryLabel}
          </p>
        ) : null}

        <h2 className="line-clamp-2 text-[14.5px] font-semibold leading-snug tracking-tight text-foreground sm:text-[15px]">
          <Link
            href={`/product/${item.slug}`}
            className="transition-colors hover:text-brand-deep"
          >
            {item.name}
          </Link>
        </h2>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[1.15rem] font-bold tabular-nums text-brand-deep">
            {formatMoney(item.price, item.currency)}
          </span>
          {sale && item.compareAtPrice ? (
            <span className="text-[13px] font-medium text-muted-foreground line-through">
              {formatMoney(item.compareAtPrice, item.currency)}
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            "text-[12px] font-medium",
            item.inStock ? "text-success" : "text-cta",
          )}
        >
          {item.inStock ? "In stock" : "Out of stock"}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={!item.inStock}
            onClick={onBag}
            className="pressable inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground text-[12px] font-semibold text-white transition-colors hover:bg-success disabled:opacity-40"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {justMoved ? "Added" : "Bag"}
          </button>
          <button
            type="button"
            disabled={!item.inStock}
            onClick={onBuy}
            className="pressable inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-cta text-[12px] font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5" />
            Buy
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center gap-1.5 pt-0.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-cta"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>
    </article>
  );
}
