import { ViewTransition } from "react";
import type { ReactNode } from "react";

interface ProductMediaTransitionProps {
  productId: string;
  children: ReactNode;
}

/**
 * Shared-element identity for product photography (card → PDP gallery).
 * Same `name` on both ends → browser morphs position/size natively.
 */
export function ProductMediaTransition({
  productId,
  children,
}: ProductMediaTransitionProps) {
  return (
    <ViewTransition name={`product-media-${productId}`} share="product-morph">
      {children}
    </ViewTransition>
  );
}
