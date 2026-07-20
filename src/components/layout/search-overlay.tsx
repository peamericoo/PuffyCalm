"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchProducts } from "@/lib/mock/products";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Centered search stage — larger field + fluid product autocomplete.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => searchProducts(query, 6), [query]);
  const showResults = open && query.trim().length > 0;

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // handleClose is stable enough for overlay lifecycle (query reset + parent close)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only rebind when open flips
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[55] flex items-start justify-center",
        "pt-[min(18vh,7.5rem)] sm:pt-[min(20vh,8.5rem)]",
        "px-4 sm:px-6",
        "transition-[opacity,visibility] duration-300 ease-out",
        open
          ? "pointer-events-auto visible opacity-100"
          : "pointer-events-none invisible opacity-0",
      )}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      {/* Backdrop */}
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-[#1a2332]/35 backdrop-blur-[3px] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        aria-label="Close search"
        tabIndex={-1}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "search-panel relative z-10 w-full max-w-xl",
          open ? "search-panel--in" : "search-panel--out",
        )}
      >
        <div
          className={cn(
            "overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/97 shadow-[0_28px_60px_-24px_rgb(26_35_50/0.45)]",
            "ring-1 ring-border/40 backdrop-blur-2xl",
          )}
        >
          <form
            className="flex items-center gap-2 border-b border-border/50 p-3 sm:gap-3 sm:p-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (results[0]) {
                handleClose();
                router.push(`/product/${results[0].slug}`);
              } else if (query.trim()) {
                handleClose();
                router.push("/category/all");
              }
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:h-5 sm:w-5"
                aria-hidden
              />
              <input
                ref={inputRef}
                type="search"
                value={open ? query : ""}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                aria-autocomplete="list"
                aria-controls={listId}
                role="combobox"
                aria-expanded={showResults}
                aria-haspopup="listbox"
                className={cn(
                  "h-12 w-full rounded-full border border-border/60 bg-muted/45 py-3 pl-12 pr-4",
                  "text-[15px] font-medium text-foreground placeholder:text-muted-foreground/70",
                  "outline-none transition-all duration-200 sm:h-[3.25rem] sm:pl-[3.25rem] sm:text-base",
                  "hover:border-brand/30 hover:bg-white",
                  "focus:border-brand/45 focus:bg-white focus:ring-2 focus:ring-brand/20",
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-full sm:h-12 sm:w-12"
              aria-label="Close search"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </form>

          {/* Autocomplete results */}
          <div
            id={listId}
            role="listbox"
            aria-label="Product suggestions"
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              showResults
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="max-h-[min(52vh,22rem)] overflow-y-auto p-2 sm:p-2.5">
                {results.length === 0 && showResults ? (
                  <p className="search-result-item px-3 py-6 text-center text-sm text-muted-foreground">
                    No products match “{query.trim()}”
                  </p>
                ) : (
                  <ul className="flex flex-col gap-0.5">
                    {results.map((product, i) => (
                      <li
                        key={product.id}
                        role="option"
                        aria-selected={false}
                        className="search-result-item"
                        style={{ animationDelay: `${i * 45}ms` }}
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          transitionTypes={["nav-forward"]}
                          onClick={handleClose}
                          className={cn(
                            "group flex items-center gap-3 rounded-2xl p-2.5 sm:gap-3.5 sm:p-3",
                            "transition-all duration-200",
                            "hover:bg-brand-soft/90",
                          )}
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/60 sm:h-16 sm:w-16">
                            <Image
                              src={product.imageUrl}
                              alt={product.imageAlt}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deep/80">
                              {product.categoryLabel ?? "Shop"}
                            </span>
                            <span className="block truncate text-[14px] font-semibold leading-snug text-foreground sm:text-[15px]">
                              {product.name}
                            </span>
                            <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                              {product.shortDescription}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1 pl-1">
                            <span className="text-[14px] font-semibold tabular-nums text-brand-deep">
                              {formatMoney(product.price, product.currency)}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-brand-deep/0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-deep/70" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {results.length > 0 ? (
                  <div className="mt-1 border-t border-border/40 px-1 pt-1.5">
                    <Link
                      href="/category/all"
                      onClick={onClose}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold text-brand-deep transition-colors hover:bg-brand-soft"
                    >
                      Browse all products
                      <ArrowRight className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {!showResults ? (
            <p className="px-4 pb-3.5 pt-1 text-center text-[12.5px] text-muted-foreground sm:pb-4">
              Try “massager”, “desk”, “heat” or “cushion”
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
