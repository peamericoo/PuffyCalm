"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mainNav } from "@/lib/mock/site";
import { getMockCartItemCount } from "@/lib/mock/cart";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = getMockCartItemCount();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="border-b border-border/50 bg-brand-soft/40">
        <Container className="flex h-9 items-center justify-center">
          <p className="text-center text-[11px] font-medium tracking-wide text-brand-deep sm:text-xs">
            Free tracked shipping on orders over $75 · Ships to US, UK, AU & CA
          </p>
        </Container>
      </div>

      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <div className="flex items-center gap-2 lg:gap-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href="/account" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-deep px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </Container>

      {/* Desktop/mobile search panel */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/60 bg-background transition-all duration-300",
          searchOpen ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <Container className="py-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(false);
            }}
          >
            <Input
              type="search"
              placeholder="Search products, comfort, recovery..."
              aria-label="Search products"
              className="flex-1"
            />
            <Button type="submit" variant="brand">
              Search
            </Button>
          </form>
        </Container>
      </div>

      {/* Mobile nav drawer */}
      <div
        className={cn(
          "fixed inset-x-0 top-[calc(2.25rem+4rem)] z-40 border-b border-border bg-background/95 backdrop-blur-xl transition-all duration-300 lg:hidden",
          mobileOpen
            ? "pointer-events-auto max-h-[80vh] opacity-100"
            : "pointer-events-none max-h-0 overflow-hidden opacity-0",
        )}
      >
        <Container className="space-y-1 py-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="brand" className="w-full">
              <Link href="/register" onClick={() => setMobileOpen(false)}>
                Create account
              </Link>
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}
