"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  Armchair,
  BookOpen,
  ChevronDown,
  CircleDollarSign,
  Flame,
  Hand,
  Heart,
  HelpCircle,
  LayoutGrid,
  Menu,
  Monitor,
  Moon,
  Plane,
  RefreshCw,
  Search,
  ShoppingBag,
  Sofa,
  Sparkles,
  Star,
  Tag,
  Target,
  Thermometer,
  Truck,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { mainNav, type NavChild } from "@/lib/mock/site";
import { getMockCartItemCount } from "@/lib/mock/cart";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<NavChild["icon"], LucideIcon> = {
  grid: LayoutGrid,
  sparkles: Sparkles,
  tag: Tag,
  dollar: CircleDollarSign,
  star: Star,
  hand: Hand,
  flame: Flame,
  activity: Activity,
  plane: Plane,
  armchair: Armchair,
  sofa: Sofa,
  thermometer: Thermometer,
  moon: Moon,
  monitor: Monitor,
  target: Target,
  book: BookOpen,
  truck: Truck,
  refresh: RefreshCw,
  help: HelpCircle,
};

/**
 * Floating fixed top bar — glass pill with always-on search,
 * high-contrast nav, refined category balloons, unique icon motion.
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
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
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[var(--promo-h)] z-50 nav-shell pt-2 sm:pt-2.5">
        <header
          className={cn(
            "pointer-events-auto mx-auto flex h-[3.5rem] w-full max-w-[min(1760px,100%)] items-center gap-1.5 rounded-full px-2 pl-2.5 sm:h-[4rem] sm:gap-3 sm:px-3.5 sm:pl-4 lg:px-4 lg:pl-5 nav-float animate-fade-in",
            scrolled && "is-scrolled",
          )}
        >
          {/* Left — menu + brand + primary nav */}
          <div className="flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <Logo className="shrink-0" />

            <nav
              className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-2"
              aria-label="Primary"
            >
              {mainNav.map((item) => {
                const children = item.children ?? [];
                const hasChildren = children.length > 0;

                return (
                  <div key={item.href} className="group/nav relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "pressable nav-link inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13.5px] font-semibold tracking-[-0.01em] xl:px-3.5 xl:text-[14px]",
                        "text-foreground/90 transition-colors duration-200",
                        "hover:bg-brand-soft/90 hover:text-brand-deep",
                      )}
                    >
                      {item.label}
                      {hasChildren ? (
                        <ChevronDown className="h-3.5 w-3.5 text-foreground/45 transition-transform duration-300 group-hover/nav:rotate-180 group-hover/nav:text-brand-deep" />
                      ) : null}
                    </Link>

                    {hasChildren ? (
                      <div
                        className={cn(
                          "pointer-events-none absolute left-1/2 top-full z-50 w-[15.5rem] -translate-x-1/2 pt-3 opacity-0",
                          "transition-[opacity,transform,visibility] duration-300 ease-out",
                          "invisible translate-y-1",
                          "group-hover/nav:pointer-events-auto group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100",
                          "group-focus-within/nav:pointer-events-auto group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100",
                        )}
                      >
                        {/* Hover bridge */}
                        <div className="absolute inset-x-0 top-0 h-3" aria-hidden />
                        <div className="nav-dropdown overflow-hidden rounded-2xl border border-border/60 bg-white/97 py-2 shadow-[0_22px_48px_-18px_rgb(26_35_50/0.38)] backdrop-blur-xl ring-1 ring-white/80">
                          <div className="px-3 pb-1.5 pt-0.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                              {item.label}
                            </p>
                          </div>
                          <ul className="flex flex-col gap-0.5 px-1.5">
                            {children.map((child) => {
                              const Icon = NAV_ICONS[child.icon];
                              return (
                                <li key={child.href + child.label}>
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      "group/item flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13.5px] font-medium text-foreground/80",
                                      "transition-all duration-200",
                                      "hover:bg-brand-soft hover:text-brand-deep",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                                        "bg-brand-soft/80 text-brand-deep",
                                        "ring-1 ring-brand/15",
                                        "transition-all duration-200",
                                        "group-hover/item:bg-white group-hover/item:shadow-sm group-hover/item:ring-brand/30",
                                      )}
                                    >
                                      <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
                                    </span>
                                    <span className="min-w-0 flex-1 leading-snug">
                                      {child.label}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="mt-1 border-t border-border/50 px-2.5 pt-1.5">
                            <Link
                              href={item.href}
                              className="flex items-center justify-between rounded-xl px-2 py-2 text-[12.5px] font-semibold text-brand-deep transition-colors hover:bg-brand-soft"
                            >
                              View all {item.label.toLowerCase()}
                              <span aria-hidden className="text-brand-deep/60">
                                →
                              </span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Center — always-open search, integrated in the bar */}
          <form
            className="nav-search group/search mx-1 hidden min-w-0 flex-1 sm:flex sm:max-w-[13rem] md:max-w-[16rem] lg:mx-2 lg:max-w-[15rem] xl:max-w-[18rem]"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label className="relative flex w-full items-center">
              <Search
                className="nav-icon-svg nav-icon-svg--search pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground"
                strokeWidth={2.2}
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Search products..."
                aria-label="Search products"
                className={cn(
                  "h-9 w-full rounded-full border border-border/70 bg-muted/55 py-2 pl-9 pr-3",
                  "text-[13px] font-medium text-foreground placeholder:text-muted-foreground/75",
                  "shadow-none outline-none transition-all duration-200",
                  "hover:border-brand/35 hover:bg-white/90",
                  "focus:border-brand/50 focus:bg-white focus:ring-2 focus:ring-brand/20",
                )}
              />
            </label>
          </form>

          {/* Right — utility icons with unique motion */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-0.5">
            {/* Mobile search — compact field when sm search is hidden */}
            <form
              className="nav-search group/search mr-0.5 flex min-w-0 flex-1 sm:hidden"
              role="search"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="relative flex w-[min(42vw,9.5rem)] items-center">
                <Search
                  className="nav-icon-svg nav-icon-svg--search pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground"
                  strokeWidth={2.2}
                  aria-hidden
                />
                <input
                  type="search"
                  name="q"
                  placeholder="Search..."
                  aria-label="Search products"
                  className={cn(
                    "h-9 w-full rounded-full border border-border/70 bg-muted/55 py-2 pl-8 pr-2.5",
                    "text-[12.5px] font-medium text-foreground placeholder:text-muted-foreground/75",
                    "outline-none focus:border-brand/50 focus:bg-white focus:ring-2 focus:ring-brand/20",
                  )}
                />
              </label>
            </form>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="nav-icon nav-icon--heart pressable hidden h-9 w-9 sm:inline-flex"
            >
              <Link href="/wishlist" aria-label="Wishlist">
                <Heart className="nav-icon-svg h-[17px] w-[17px]" />
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="nav-icon nav-icon--user pressable h-9 w-9"
            >
              <Link href="/account" aria-label="Account">
                <User className="nav-icon-svg h-[17px] w-[17px]" />
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="nav-icon nav-icon--cart pressable relative h-9 w-9"
            >
              <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
                <ShoppingBag className="nav-icon-svg h-[17px] w-[17px]" />
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
            "nav-shell absolute inset-x-0 top-[calc(var(--promo-h)+4.5rem)] max-h-[min(70vh,520px)] overflow-y-auto sm:top-[calc(var(--promo-h)+5rem)]",
          )}
        >
          <div
            className={cn(
              "max-h-[min(70vh,520px)] overflow-y-auto rounded-2xl border border-border bg-white/95 p-2.5 shadow-2xl backdrop-blur-xl transition-transform duration-300",
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
                      className="flex-1 rounded-xl px-3.5 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-brand-soft"
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
                    <div className="mb-1.5 ml-2 space-y-0.5 border-l border-border/70 pl-1.5">
                      {children.map((child) => {
                        const Icon = NAV_ICONS[child.icon];
                        return (
                          <Link
                            key={child.href + child.label}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand-deep"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            {child.label}
                          </Link>
                        );
                      })}
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
      </div>
    </>
  );
}
