"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mainNav } from "@/lib/mock/site";
import { getMockCartItemCount } from "@/lib/mock/cart";
import { cn } from "@/lib/utils";

/**
 * Floating fixed top bar — near full-width glass pill.
 * Desktop nav shows refined subcategory dropdowns on hover.
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(
    null,
  );
  const cartCount = getMockCartItemCount();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen, searchOpen]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[var(--promo-h)] z-50 px-1.5 pt-2 sm:px-3 sm:pt-2.5 lg:px-4">
        <header
          className={cn(
            "pointer-events-auto mx-auto flex h-[3.5rem] w-full max-w-[min(1760px,100%)] items-center justify-between gap-2 rounded-full px-2.5 pl-3.5 sm:h-[4rem] sm:gap-3 sm:px-4 sm:pl-5 nav-float animate-fade-in",
            scrolled && "is-scrolled",
          )}
        >
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => {
                setSearchOpen(false);
                setMobileOpen((v) => !v);
              }}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <Logo className="shrink-0" />

            <nav
              className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-3"
              aria-label="Primary"
            >
              {mainNav.map((item) => {
                const children = item.children ?? [];
                const hasChildren = children.length > 0;

                return (
                  <div key={item.href} className="group/nav relative">
                    <Link
                      href={item.href}
                      className="pressable inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-300 hover:bg-brand-soft/80 hover:text-brand-deep xl:px-3.5"
                    >
                      {item.label}
                      {hasChildren ? (
                        <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-300 group-hover/nav:rotate-180 group-hover/nav:opacity-80" />
                      ) : null}
                    </Link>

                    {hasChildren ? (
                      <div
                        className={cn(
                          "pointer-events-none absolute left-1/2 top-full z-50 w-48 -translate-x-1/2 pt-2 opacity-0 transition-all duration-300 ease-out",
                          "group-hover/nav:pointer-events-auto group-hover/nav:opacity-100",
                          "invisible group-hover/nav:visible",
                        )}
                      >
                        <div className="nav-dropdown overflow-hidden rounded-2xl border border-border/70 bg-white/95 py-1.5 shadow-[0_18px_40px_-20px_rgb(26_35_50/0.35)] backdrop-blur-xl">
                          {children.map((child) => (
                            <Link
                              key={child.href + child.label}
                              href={child.href}
                              className="block px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:bg-brand-soft hover:text-brand-deep"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="pressable h-9 w-9"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen((v) => !v);
              }}
            >
              <Search className="h-[17px] w-[17px]" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="pressable hidden h-9 w-9 sm:inline-flex"
            >
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-[17px] w-[17px]" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="pressable h-9 w-9"
            >
              <Link href="/account" aria-label="Account">
                <User className="h-[17px] w-[17px]" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="pressable relative h-9 w-9"
            >
              <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
                <ShoppingBag className="h-[17px] w-[17px]" />
                {cartCount > 0 ? (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-cta px-1 text-[9px] font-semibold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button
              asChild
              variant="default"
              size="sm"
              className="pressable ml-1 hidden h-8 px-3.5 text-xs md:inline-flex"
            >
              <Link href="/category/all">Shop sale</Link>
            </Button>
          </div>
        </header>
      </div>

      {/* Compact search — centered, modest width */}
      <div
        className={cn(
          "fixed inset-x-0 top-[calc(var(--promo-h)+4.5rem)] z-40 flex justify-center px-3 transition-all duration-300 sm:top-[calc(var(--promo-h)+5rem)]",
          searchOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1.5 opacity-0",
        )}
      >
        <div className="w-full max-w-[22rem] rounded-2xl border border-border/80 bg-white/95 p-2 shadow-lg backdrop-blur-xl sm:max-w-sm">
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(false);
            }}
          >
            <Input
              type="search"
              autoFocus={searchOpen}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-9 flex-1 border-border/60 bg-muted/40 px-3.5 text-[13px] shadow-none"
            />
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="h-9 shrink-0 px-3.5 text-xs"
            >
              Go
            </Button>
          </form>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <button
          type="button"
          className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-x-2 top-[calc(var(--promo-h)+4.5rem)] max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-border bg-white/95 p-2.5 shadow-2xl backdrop-blur-xl transition-transform duration-300 sm:inset-x-3 sm:top-[calc(var(--promo-h)+5rem)]",
            mobileOpen ? "translate-y-0" : "-translate-y-3",
          )}
        >
          <nav className="flex flex-col gap-0.5" aria-label="Mobile">
            {mainNav.map((item) => {
              const children = item.children ?? [];
              const hasChildren = children.length > 0;
              const expanded = openMobileSection === item.label;

              return (
                <div key={item.href} className="rounded-xl">
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-xl px-3.5 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-brand-soft"
                    >
                      {item.label}
                    </Link>
                    {hasChildren ? (
                      <button
                        type="button"
                        aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                        className="mr-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-brand-soft"
                        onClick={() =>
                          setOpenMobileSection(expanded ? null : item.label)
                        }
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            expanded && "rotate-180",
                          )}
                        />
                      </button>
                    ) : null}
                  </div>
                  {hasChildren && expanded ? (
                    <div className="mb-1 ml-3 space-y-0.5 border-l border-border/70 pl-2">
                      {children.map((child) => (
                        <Link
                          key={child.href + child.label}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-deep"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-2.5">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="default" size="sm" className="w-full">
              <Link href="/category/all" onClick={() => setMobileOpen(false)}>
                Shop sale
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
