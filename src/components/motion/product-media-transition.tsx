import { ViewTransition } from "react";
import type { ReactNode } from "react";

interface ProductMediaTransitionProps {
  productId: string;
  children: ReactNode;
  className?: string;
  enabled?: boolean;
}

/**
 * Shared-element identity for product photography (card → PDP gallery).
 * Fills parent (`absolute inset-0`) so ViewTransition wrappers never collapse
 * card/gallery aspect boxes.
 */
export function ProductMediaTransition({
  productId,
  children,
  className,
  enabled = true,
}: ProductMediaTransitionProps) {
  const content = (
    <div className={className ?? "absolute inset-0 h-full w-full"}>
      {children}
    </div>
  );

  if (!enabled) {
    return content;
  }

  return (
    <ViewTransition name={`product-media-${productId}`} share="product-morph">
      {content}
    </ViewTransition>
  );
}
