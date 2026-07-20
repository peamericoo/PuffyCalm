"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type CatalogLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  slug: string;
};

/**
 * Intra-catalog navigation — native View Transition type "catalog".
 * prefetch + scroll=false keep category switches light and stable.
 */
export function CatalogLink({
  slug,
  children,
  ...rest
}: CatalogLinkProps) {
  return (
    <Link
      href={`/category/${slug}`}
      prefetch
      scroll={false}
      transitionTypes={["catalog"]}
      {...rest}
    >
      {children}
    </Link>
  );
}
