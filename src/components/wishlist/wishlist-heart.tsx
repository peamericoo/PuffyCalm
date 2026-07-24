"use client";

import { memo } from "react";
import { Heart } from "lucide-react";
import {
  useIsWishlisted,
  useWishlistStore,
  type WishlistableProduct,
} from "@/lib/wishlist/store";
import { cn } from "@/lib/utils";

interface WishlistHeartProps {
  product: WishlistableProduct;
  className?: string;
  /** Larger hit target on cards */
  size?: "sm" | "md" | "lg";
  /** Stop propagation (card links) */
  stopPropagation?: boolean;
}

/**
 * Shared heart control — toggles calm list, filled when saved.
 */
export const WishlistHeart = memo(function WishlistHeart({
  product,
  className,
  size = "md",
  stopPropagation = true,
}: WishlistHeartProps) {
  const saved = useIsWishlisted(product.id);
  const toggle = useWishlistStore((s) => s.toggle);

  const dim =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-12 w-12 sm:h-14 sm:w-14"
        : "h-10 w-10";

  const icon =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-4 w-4" : "h-4 w-4";

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from calm list" : "Save to calm list"}
      aria-pressed={saved}
      onClick={(e) => {
        if (stopPropagation) {
          e.preventDefault();
          e.stopPropagation();
        }
        toggle(product);
      }}
      className={cn(
        "pressable inline-flex items-center justify-center rounded-full transition-all duration-300",
        "bg-white/95 text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm",
        "hover:bg-white hover:text-cta hover:ring-cta/25",
        saved && "bg-cta/10 text-cta ring-cta/30",
        dim,
        className,
      )}
    >
      <Heart
        className={cn(
          icon,
          "transition-transform duration-300",
          saved && "fill-current scale-110",
        )}
        strokeWidth={1.9}
      />
    </button>
  );
});

WishlistHeart.displayName = "WishlistHeart";
