"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mainNav } from "@/lib/mock/site";
import { getMockCartItemCount } from "@/lib/mock/cart";
import { cn } from "@/lib/utils";

/**
 * Floating fixed top bar — wider, glass pill, same on every page.
 * Sits below the promo marquee.
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
      <div className="pointer-events-none fixed inset-x-0 top-[var(--promo-h)] z-50 px-2 pt-2.5 sm:px-4 sm:pt-3">
        <header
          className={cn(
            "pointer-events-auto mx-auto flex h-[3.75rem] w-full max-w-[1440px] items-center justify-between gap-3 rounded-full px-3 pl-4 sm:h-[4.25rem] sm:px-5 sm:pl-6 nav-float animate-fade-in",
            scrolled && "is-scrolled",
          )}
        >
          <div className="flex min-w-0 items-center gap-1 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
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
              className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-4"
              aria-label="Primary"
            >
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="pressable rounded-full px-3.5 py-2 text-[13px] font-medium text-muted-foreground hover:bg-brand-soft hover:text-brand-deep xl:px-4"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="pressable"
              aria-label="Search"
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen((v) => !v);
              }}
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="pressable hidden sm:inline-flex"
            >
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="h-[18px] w-[18px]" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="pressable">
              <Link href="/account" aria-label="Account">
                <User className="h-[18px] w-[18px]" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="pressable relative"
            >
              <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cta px-1 text-[10px] font-semibold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button
              asChild
              variant="default"
              size="sm"
              className="pressable ml-1 hidden md:inline-flex"
            >
              <Link href="/category/all">Shop sale</Link>
            </Button>
          </div>
        </header>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 top-[calc(var(--promo-h)+4.9rem)] z-40 px-2 transition-all duration-300 sm:top-[calc(var(--promo-h)+5.3rem)] sm:px-4",
          searchOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <div className="mx-auto max-w-[1440px] rounded-3xl border border-border bg-white/95 p-3 shadow-xl backdrop-blur-xl sm:p-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(false);
            }}
          >
            <Input
              type="search"
              autoFocus={searchOpen}
              placeholder="Search recovery, comfort, everyday..."
              aria-label="Search products"
              className="flex-1"
            />
            <Button type="submit" variant="default">
              Search
            </Button>
          </form>
        </div>
      </div>

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
            "absolute inset-x-2 top-[calc(var(--promo-h)+4.9rem)] rounded-3xl border border-border bg-white/95 p-3 shadow-2xl backdrop-blur-xl transition-transform duration-300 sm:inset-x-4 sm:top-[calc(var(--promo-h)+5.3rem)]",
            mobileOpen ? "translate-y-0" : "-translate-y-3",
          )}
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-brand-soft"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="default" className="w-full">
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
