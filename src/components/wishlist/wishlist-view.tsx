"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Heart,
  Pin,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart/store";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/cart/constants";
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

function isOnSale(item: WishlistItem) {
  return Boolean(item.compareAtPrice && item.compareAtPrice > item.price);
}

/**
 * Calm List — mood-board wishlist with pin, filters, add-all, share mock.
 */
export function WishlistView() {
  const rawItems = useWishlistStore((s) => s.items);
  const hasHydrated = useWishlistStore((s) => s.hasHydrated);
  const remove = useWishlistStore((s) => s.remove);
  const pin = useWishlistStore((s) => s.pin);
  const clear = useWishlistStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const addItemQuiet = useCartStore((s) => s.addItemQuiet);

  const [filter, setFilter] = useState<Filter>("all");
  const [shareNote, setShareNote] = useState<string | null>(null);
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
    window.location.href = "/checkout";
  };

  const addAllToBag = () => {
    const stocked = items.filter((i) => i.inStock);
    stocked.forEach((item) => addItem(toCartProduct(item), 1));
  };

  const shareList = async () => {
    const text = `My PuffyCalm calm list (${items.length} pieces) — ${items.map((i) => i.name).join(", ")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Calm List · PuffyCalm", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShareNote("List copied");
        window.setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  };

  if (!hasHydrated) {
    return (
      <section className="px-3 py-16 sm:px-5">
        <Container className="max-w-lg text-center text-sm text-muted-foreground">
          Loading your calm list…
        </Container>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={cn(styles.heroGlow, "px-3 pb-20 pt-6 sm:px-5 sm:pb-24 sm:pt-8")}>
        <Container className="animate-fade-up">
          <EmptyWishlist suggestions={suggestions} />
        </Container>
      </section>
    );
  }

  const [hero, ...rest] = filtered;
  const mosaic = items.slice(0, 5);

  return (
    <section className={cn(styles.heroGlow, "px-3 pb-24 pt-5 sm:px-5 sm:pb-28 sm:pt-7")}>
      <Container className="animate-fade-up max-w-[1180px]">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cta">
              <Heart className="h-3 w-3 fill-current" />
              Calm list
            </p>
            <h1 className="mt-1 font-display text-[1.65rem] font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
              Saved for your real days
            </h1>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted-foreground sm:text-[14.5px]">
              {items.length} piece{items.length === 1 ? "" : "s"}
              {savings > 0 ? (
                <>
                  {" "}
                  · up to{" "}
                  <span className="font-semibold text-brand-deep">
                    {formatMoney(savings)}
                  </span>{" "}
                  in list savings
                </>
              ) : null}
              {totalValue > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney(totalValue)}
                  </span>{" "}
                  total
                </>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pressable"
              onClick={() => void shareList()}
            >
              <Share2 className="h-3.5 w-3.5" />
              {shareNote ?? "Share list"}
            </Button>
            {inStockCount > 0 ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="pressable"
                onClick={addAllToBag}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add all ({inStockCount})
              </Button>
            ) : null}
          </div>
        </header>

        {/* Living mosaic — visual identity of the list */}
        {mosaic.length >= 2 ? (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 sm:mb-8 sm:gap-3">
            {mosaic.map((item, i) => (
              <Link
                key={item.productId}
                href={`/product/${item.slug}`}
                className={cn(
                  styles.mosaicFloat,
                  "relative shrink-0 overflow-hidden rounded-2xl bg-brand-soft shadow-sm ring-1 ring-white/80",
                  i === 0 ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20",
                )}
                style={
                  {
                    animationDelay: `${i * 0.35}s`,
                    "--rot": `${(i % 2 === 0 ? -1 : 1) * (2 + i)}deg`,
                  } as CSSProperties
                }
              >
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </Link>
            ))}
            <div className="ml-1 flex shrink-0 flex-col justify-center pl-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Your board
              </p>
              <p className="text-[13px] font-semibold text-foreground">
                {items.length} saved
              </p>
            </div>
          </div>
        ) : null}

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-1.5 sm:mb-6">
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
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
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
          <div className="rounded-[1.35rem] border border-border/70 bg-white/90 px-5 py-12 text-center shadow-sm">
            <p className="text-[15px] font-semibold text-foreground">
              Nothing in this filter
            </p>
            <button
              type="button"
              className="mt-2 text-[13px] font-semibold text-brand-deep"
              onClick={() => setFilter("all")}
            >
              Show all
            </button>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
            {/* Featured / first pin */}
            {hero ? (
              <WishlistHeroCard
                item={hero}
                className="lg:col-span-7"
                onRemove={() => remove(hero.productId)}
                onPin={() => pin(hero.productId)}
                onBag={() => moveToBag(hero)}
                onBuy={() => buyNow(hero)}
                justMoved={movedId === hero.productId}
              />
            ) : null}

            <div
              className={cn(
                "grid gap-4 sm:grid-cols-2",
                hero ? "lg:col-span-5 lg:grid-cols-1" : "lg:col-span-12 lg:grid-cols-3",
              )}
            >
              {(hero ? rest : filtered).map((item, i) => (
                <WishlistRowCard
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
          </div>
        )}

        {/* Free shipping nudge if list value is near threshold */}
        {totalValue > 0 && totalValue < FREE_SHIPPING_THRESHOLD ? (
          <p className="mt-6 rounded-2xl bg-brand-soft/80 px-4 py-3 text-center text-[13px] text-foreground/90 ring-1 ring-brand/10">
            Add{" "}
            <span className="font-semibold text-brand-deep">
              {formatMoney(FREE_SHIPPING_THRESHOLD - totalValue)}
            </span>{" "}
            more from your list to unlock free shipping on checkout.
          </p>
        ) : totalValue >= FREE_SHIPPING_THRESHOLD ? (
          <p className="mt-6 rounded-2xl bg-success/10 px-4 py-3 text-center text-[13px] font-medium text-success ring-1 ring-success/20">
            Your list already clears free shipping — nice.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/category/all">
              Keep browsing
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear your entire calm list?")) clear();
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
        Your calm list is empty
      </h1>
      <p className="mx-auto mt-2 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
        Tap the heart on anything you love — we’ll keep it here for softer
        days, sales, and one-tap checkout.
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

function WishlistHeroCard({
  item,
  className,
  onRemove,
  onPin,
  onBag,
  onBuy,
  justMoved,
}: {
  item: WishlistItem;
  className?: string;
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
        "relative overflow-hidden rounded-[1.35rem] border border-border/70 bg-white shadow-sm ring-1 ring-white/70",
        className,
      )}
    >
      <div className="grid sm:grid-cols-[1.1fr_1fr]">
        <Link
          href={`/product/${item.slug}`}
          className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[22rem]"
        >
          <Image
            src={item.imageUrl}
            alt={item.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
          {sale ? (
            <span className="absolute left-3 top-3 rounded-full bg-brand-deep px-2.5 py-1 text-[11px] font-bold text-white">
              Sale
            </span>
          ) : null}
          {item.pinned ? (
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-foreground shadow-sm">
              Pinned
            </span>
          ) : null}
        </Link>

        <div className="flex flex-col p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {item.categoryLabel ?? "Saved"}
          </p>
          <h2 className="mt-1 font-display text-[1.35rem] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-[1.5rem]">
            <Link
              href={`/product/${item.slug}`}
              className="transition-colors hover:text-brand-deep"
            >
              {item.name}
            </Link>
          </h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-[1.35rem] font-bold tabular-nums text-brand-deep">
              {formatMoney(item.price, item.currency)}
            </span>
            {sale && item.compareAtPrice ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatMoney(item.compareAtPrice, item.currency)}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-2 text-[12.5px] font-medium",
              item.inStock ? "text-success" : "text-cta",
            )}
          >
            {item.inStock ? "In stock — ready when you are" : "Currently out of stock"}
          </p>

          <div className="mt-auto flex flex-col gap-2 pt-6">
            <Button
              type="button"
              variant="default"
              className="pressable w-full"
              disabled={!item.inStock}
              onClick={onBag}
            >
              <ShoppingBag className="h-4 w-4" />
              {justMoved ? "Added to bag" : "Move to bag"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!item.inStock}
                onClick={onBuy}
              >
                <Zap className="h-3.5 w-3.5" />
                Buy now
              </Button>
              <Button type="button" variant="soft" className="w-full" onClick={onPin}>
                <Pin className={cn("h-3.5 w-3.5", item.pinned && "fill-current")} />
                {item.pinned ? "Unpin" : "Pin"}
              </Button>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-cta"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove from list
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function WishlistRowCard({
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
        "flex gap-3 overflow-hidden rounded-[1.2rem] border border-border/70 bg-white/95 p-2.5 shadow-sm ring-1 ring-white/70 sm:p-3",
      )}
      style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
    >
      <Link
        href={`/product/${item.slug}`}
        className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-brand-soft sm:h-28 sm:w-28"
      >
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          fill
          className="object-cover"
          sizes="112px"
        />
        {sale ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-deep px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Tag className="inline h-2.5 w-2.5" /> Sale
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground sm:text-[14.5px]">
              <Link
                href={`/product/${item.slug}`}
                className="hover:text-brand-deep"
              >
                {item.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-[14px] font-bold tabular-nums text-brand-deep">
              {formatMoney(item.price, item.currency)}
              {sale && item.compareAtPrice ? (
                <span className="ml-1.5 text-[12px] font-medium text-muted-foreground line-through">
                  {formatMoney(item.compareAtPrice, item.currency)}
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onPin}
            aria-label={item.pinned ? "Unpin" : "Pin"}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
              item.pinned
                ? "bg-brand-soft text-brand-deep"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Pin
              className={cn("h-3.5 w-3.5", item.pinned && "fill-current")}
              strokeWidth={2}
            />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <button
            type="button"
            disabled={!item.inStock}
            onClick={onBag}
            className={cn(
              "inline-flex h-8 items-center gap-1 rounded-full bg-foreground px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-success disabled:opacity-40",
            )}
          >
            <ShoppingBag className="h-3 w-3" />
            {justMoved ? "Added" : "Bag"}
          </button>
          <button
            type="button"
            disabled={!item.inStock}
            onClick={onBuy}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-cta px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-cta-hover disabled:opacity-40"
          >
            <Zap className="h-3 w-3" />
            Buy
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-cta/10 hover:text-cta"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
