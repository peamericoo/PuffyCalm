import Link from "next/link";
import type { ComponentProps } from "react";

type ProductLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  slug: string;
  /** Navigation intent for View Transitions */
  direction?: "forward" | "back";
};

/**
 * Product route link with View Transition types.
 * Zero runtime cost beyond Next Link — no animation libraries.
 */
export function ProductLink({
  slug,
  direction = "forward",
  children,
  scroll = true,
  ...rest
}: ProductLinkProps) {
  return (
    <Link
      href={`/product/${slug}`}
      prefetch={false}
      scroll={scroll}
      transitionTypes={direction === "back" ? ["nav-back"] : ["nav-forward"]}
      {...rest}
    >
      {children}
    </Link>
  );
}
