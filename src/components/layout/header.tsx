"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Armchair,
  ArrowRight,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { HeaderAccountButton } from "@/components/auth/header-account-button";
import { Logo } from "@/components/layout/logo";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { Button } from "@/components/ui/button";
import { useCartItemCount, useCartStore } from "@/lib/cart/store";
import { useWishlistCount } from "@/lib/wishlist/store";
import { mainNav, type NavChild } from "@/lib/site";
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
 * Floating glass top bar — clear side gutters on mobile,
 * refined desktop nav balloons, centered search with autocomplete.
 *
 * Desktop megamenus are controlled state (not pure CSS :hover/:focus-within).
 * Soft App Router navigations keep this Header mounted; CSS focus-within
 * left the flyout open after clicking a child link. State resets on navigate.
 */
export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Desktop flyout key = top-level nav label, or null when closed */
  const [openDesktopNav, setOpenDesktopNav] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(
    null,
  );
  /**
   * Soft navigation keeps Header mounted. When the route changes, reset menu
   * state during render (React-recommended pattern — not an effect), so flyouts
   * never stick open after a submenu click.
   */
  const [menuRoute, setMenuRoute] = useState(pathname);
  if (menuRoute !== pathname) {
    setMenuRoute(pathname);
    setOpenDesktopNav(null);
    setMobileOpen(false);
    setOpenMobileSection(null);
    setSearchOpen(false);
  }

  const cartCount = useCartItemCount();
  const wishCount = useWishlistCount();
  const openCart = useCartStore((s) => s.openCart);
  const [cartBadgePulse, setCartBadgePulse] = useState(false);
  const prevCartCount = useRef(cartCount);

  const closeAllMenus = useCallback(() => {
    setOpenDesktopNav(null);
    setMobileOpen(false);
    setOpenMobileSection(null);
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Micro-feedback when something is added to the bag */
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBadgePulse(true);
      const t = window.setTimeout(() => setCartBadgePulse(false), 480);
      prevCartCount.current = cartCount;
      return () => window.clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

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

  useEffect(() => {
    if (!mobileOpen && !openDesktopNav) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setOpenDesktopNav(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, openDesktopNav]);

  return (
    <>
      {/* CSS gutters — not Tailwind arbitrary max() (unreliable in prod) */}
      <div className="nav-outer pointer-events-none fixed inset-x-0 top-[var(--promo-h)] z-50 pt-2 sm:pt-2.5">
        <header
          style={{ viewTransitionName: "site-header" }}
          className={cn(
            "pointer-events-auto mx-auto flex h-14 w-full max-w-[min(1760px,100%)] items-center justify-between gap-2",
            "rounded-full px-2.5 pl-3 sm:h-16 sm:gap-3 sm:px-4 sm:pl-5",
            "nav-float animate-fade-in",
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

            <Logo className="min-w-0 shrink" />

            <nav
              className="ml-1 hidden items-center gap-0.5 lg:flex xl:ml-3"
              aria-label="Primary"
            >
              {mainNav.map((item) => {
                const children = item.children ?? [];
                const hasChildren = children.length > 0;
                const isOpen = openDesktopNav === item.label;

                return (
                  <div
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      if (hasChildren) setOpenDesktopNav(item.label);
                    }}
                    onMouseLeave={() => {
                      if (hasChildren) setOpenDesktopNav(null);
                    }}
                    onFocusCapture={() => {
                      if (hasChildren) setOpenDesktopNav(item.label);
                    }}
                    onBlurCapture={(e) => {
                      if (!hasChildren) return;
                      const next = e.relatedTarget as Node | null;
                      if (next && e.currentTarget.contains(next)) return;
                      setOpenDesktopNav(null);
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeAllMenus}
                      aria-expanded={hasChildren ? isOpen : undefined}
                      aria-haspopup={hasChildren ? "menu" : undefined}
                      className={cn(
                        "pressable inline-flex items-center gap-1 rounded-full px-3 py-2 xl:px-3.5",
                        "text-[13.5px] font-semibold tracking-[-0.01em] text-foreground/88",
                        "transition-colors duration-200",
                        "hover:bg-brand-soft/90 hover:text-brand-deep",
                        isOpen && "bg-brand-soft/90 text-brand-deep",
                      )}
                    >
                      {item.label}
                      {hasChildren ? (
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 text-foreground/40 transition-transform duration-300",
                            isOpen && "rotate-180 text-brand-deep",
                          )}
                        />
                      ) : null}
                    </Link>

                    {hasChildren ? (
                      <div
                        className={cn(
                          "absolute left-1/2 top-full z-50 w-[18.5rem] -translate-x-1/2 pt-3",
                          "transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          isOpen
                            ? "pointer-events-auto visible translate-y-0 opacity-100"
                            : "pointer-events-none invisible translate-y-1.5 opacity-0",
                        )}
                      >
                        <div className="absolute inset-x-4 top-0 h-3" aria-hidden />
                        <div
                          role="menu"
                          className="nav-dropdown overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/96 p-2 shadow-[0_24px_50px_-20px_rgb(26_35_50/0.42)] backdrop-blur-2xl ring-1 ring-border/50"
                        >
                          <div className="mb-1 flex items-center justify-between px-2.5 pb-1.5 pt-1">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">
                              {item.label}
                            </p>
                            <span className="h-1 w-1 rounded-full bg-brand/50" aria-hidden />
                          </div>

                          <ul className="flex flex-col gap-0.5">
                            {children.map((child) => {
                              const Icon = NAV_ICONS[child.icon];
                              return (
                                <li key={child.href + child.label} role="none">
                                  <Link
                                    href={child.href}
                                    role="menuitem"
                                    onClick={closeAllMenus}
                                    className={cn(
                                      "group/item flex items-start gap-3 rounded-[1rem] px-2.5 py-2.5",
                                      "transition-all duration-200 hover:bg-brand-soft/90",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                        "bg-gradient-to-br from-brand-soft to-white text-brand-deep",
                                        "shadow-[0_1px_0_rgb(255_255_255/0.9)_inset] ring-1 ring-brand/12",
                                        "transition-all duration-200",
                                        "group-hover/item:scale-[1.04] group-hover/item:shadow-sm group-hover/item:ring-brand/25",
                                      )}
                                    >
                                      <Icon className="h-4 w-4" strokeWidth={2} />
                                    </span>
                                    <span className="min-w-0 flex-1 pt-0.5">
                                      <span className="block text-[13.5px] font-semibold leading-tight text-foreground transition-colors group-hover/item:text-brand-deep">
                                        {child.label}
                                      </span>
                                      <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                                        {child.blurb}
                                      </span>
                                    </span>
                                    <ArrowRight
                                      className="mt-2 h-3.5 w-3.5 shrink-0 text-brand-deep/0 transition-all duration-200 group-hover/item:translate-x-0.5 group-hover/item:text-brand-deep/70"
                                      aria-hidden
                                    />
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>

                          <div className="mt-1.5 border-t border-border/40 px-1 pt-1.5">
                            <Link
                              href={item.href}
                              role="menuitem"
                              onClick={closeAllMenus}
                              className="flex items-center justify-between rounded-xl px-2.5 py-2.5 text-[12.5px] font-semibold text-brand-deep transition-colors hover:bg-brand-soft"
                            >
                              <span>Explore all {item.label.toLowerCase()}</span>
                              <ArrowRight className="h-3.5 w-3.5 opacity-70" />
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

          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "nav-icon nav-icon--search pressable h-9 w-9",
                searchOpen && "bg-brand-soft text-brand-deep",
              )}
              aria-label={searchOpen ? "Close search" : "Search"}
              aria-expanded={searchOpen}
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen((v) => !v);
              }}
            >
              {searchOpen ? (
                <X className="nav-icon-svg h-[17px] w-[17px]" />
              ) : (
                <Search className="nav-icon-svg h-[17px] w-[17px]" />
              )}
            </Button>

            <Button
              asChild
              variant="ghost"
              size="icon"
              className="nav-icon nav-icon--heart pressable relative hidden h-9 w-9 sm:inline-flex"
            >
              <Link
                href="/wishlist"
                aria-label={
                  wishCount > 0
                    ? `Calm list, ${wishCount} saved`
                    : "Calm list"
                }
              >
                <Heart className="nav-icon-svg h-[17px] w-[17px]" />
                {wishCount > 0 ? (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-cta px-1 text-[9px] font-semibold text-white">
                    {wishCount > 9 ? "9+" : wishCount}
                  </span>
                ) : null}
              </Link>
            </Button>

            <HeaderAccountButton />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="nav-icon nav-icon--cart pressable relative h-9 w-9"
              aria-label={
                cartCount > 0
                  ? `Open bag, ${cartCount} items`
                  : "Open bag"
              }
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(false);
                openCart();
              }}
            >
              <ShoppingBag className="nav-icon-svg h-[17px] w-[17px]" />
              {cartCount > 0 ? (
                <span
                  key={cartCount}
                  className={cn(
                    "absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-cta px-1 text-[9px] font-semibold text-white",
                    cartBadgePulse && "animate-cart-icon",
                  )}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
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

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

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
        <div className="nav-outer absolute inset-x-0 top-[calc(var(--promo-h)+3.85rem)] max-h-[min(72vh,560px)] sm:top-[calc(var(--promo-h)+4.45rem)]">
          <div
            className={cn(
              "max-h-[min(72vh,560px)] overflow-y-auto rounded-[1.35rem] border border-border/80 bg-white/97 p-2 shadow-2xl backdrop-blur-xl transition-transform duration-300",
              "ring-1 ring-white/70",
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
                        onClick={closeAllMenus}
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
                      <div className="mb-1.5 space-y-0.5 px-1.5 pb-1">
                        {children.map((child) => {
                          const Icon = NAV_ICONS[child.icon];
                          return (
                            <Link
                              key={child.href + child.label}
                              href={child.href}
                              onClick={closeAllMenus}
                              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-brand-soft"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-deep ring-1 ring-brand/12">
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-foreground">
                                  {child.label}
                                </span>
                                <span className="block text-[12px] text-muted-foreground">
                                  {child.blurb}
                                </span>
                              </span>
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
                <Link href="/login" onClick={closeAllMenus}>
                  Sign in with Google
                </Link>
              </Button>
              <Button asChild variant="default" size="sm" className="w-full">
                <Link href="/register" onClick={closeAllMenus}>
                  Create account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
