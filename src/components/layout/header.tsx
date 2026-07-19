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

interface HeaderProps {
  /** Transparent header for hero overlay */
  variant?: "overlay" | "solid";
}

export function Header({ variant = "solid" }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cartCount = getMockCartItemCount();
  const overlay = variant === "overlay";

  return (
    <header
      className={cn(
        "z-50 w-full",
        overlay
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 border-b border-border/80 bg-background/90 backdrop-blur-xl",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]">
        <div className="flex min-w-0 items-center gap-2 lg:gap-10">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden",
              overlay && "text-cream-text hover:bg-white/10 hover:text-white",
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Logo inverted={overlay} />

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  overlay
                    ? "text-cream-text/85 hover:bg-white/10 hover:text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {[
            {
              label: "Search",
              icon: Search,
              onClick: () => setSearchOpen((v) => !v),
            },
            { label: "Account", icon: User, href: "/account" },
            { label: "Wishlist", icon: Heart, href: "/wishlist", hideMobile: true },
            { label: "Cart", icon: ShoppingBag, href: "/cart", badge: cartCount },
          ].map((action) => {
            const Icon = action.icon;
            const className = cn(
              "relative",
              overlay && "text-cream-text hover:bg-white/10 hover:text-white",
              "hideMobile" in action && action.hideMobile && "hidden sm:inline-flex",
            );

            if ("href" in action && action.href) {
              return (
                <Button
                  key={action.label}
                  asChild
                  variant="ghost"
                  size="icon"
                  className={className}
                >
                  <Link
                    href={action.href}
                    aria-label={
                      action.badge
                        ? `${action.label}, ${action.badge} items`
                        : action.label
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {action.badge ? (
                      <span
                        className={cn(
                          "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                          overlay
                            ? "bg-white text-foreground"
                            : "bg-accent text-white",
                        )}
                      >
                        {action.badge}
                      </span>
                    ) : null}
                  </Link>
                </Button>
              );
            }

            return (
              <Button
                key={action.label}
                type="button"
                variant="ghost"
                size="icon"
                className={className}
                aria-label={action.label}
                onClick={action.onClick}
              >
                <Icon className="h-[18px] w-[18px]" />
              </Button>
            );
          })}
        </div>
      </Container>

      <div
        className={cn(
          "overflow-hidden border-t transition-all duration-300",
          overlay ? "border-white/10 bg-hero-deep/95" : "border-border bg-background",
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
              placeholder="Search recovery, comfort, everyday..."
              aria-label="Search products"
              className="flex-1"
            />
            <Button type="submit" variant="default">
              Search
            </Button>
          </form>
        </Container>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 top-16 z-40 border-b backdrop-blur-xl transition-all duration-300 lg:hidden",
          overlay
            ? "border-white/10 bg-hero-deep/95"
            : "border-border bg-background/95",
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
              className={cn(
                "block rounded-xl px-3 py-3 text-base font-medium transition-colors",
                overlay
                  ? "text-cream-text hover:bg-white/10"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  );
}
