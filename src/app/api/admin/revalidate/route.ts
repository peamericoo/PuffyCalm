/**
 * Invalidate Next.js cache after admin mutations.
 *
 * Phase H — catalog tags (see src/lib/api/catalog.ts):
 *   catalog | catalog:{slug} | categories | product:{slug}
 * Paths: / | /product/{slug} | /category/{slug}
 *
 * Phase J — home content (see src/lib/api/content.ts):
 *   tags: home | content · path: /
 *   Body: { home: true } for CMS-only; product body still revalidates `/`.
 *
 * Auth: Auth.js session with role admin|staff (UX gate).
 * Fallback: ISR revalidate=60 still expires stale pages if this is skipped.
 */

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  productSlugs?: string[];
  categorySlugs?: string[];
  /** Phase J — revalidate home promo + hero only (or in addition). */
  home?: boolean;
};

function cleanSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const s = item.trim().toLowerCase();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export async function POST(request: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "admin" && role !== "staff")) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const productSlugs = cleanSlugs(body.productSlugs);
  const categorySlugs = cleanSlugs(body.categorySlugs);
  const homeOnly =
    body.home === true && productSlugs.length === 0 && categorySlugs.length === 0;

  const tags = new Set<string>();
  const paths = new Set<string>(["/"]);

  if (homeOnly) {
    tags.add("home");
    tags.add("content");
  } else {
    tags.add("catalog");
    tags.add("categories");
    tags.add("catalog:all");
    paths.add("/category/all");
    // Product mutations also refresh home shelves (featured etc.)
    tags.add("home");
    tags.add("content");

    for (const slug of productSlugs) {
      tags.add(`product:${slug}`);
      paths.add(`/product/${slug}`);
    }
    for (const slug of categorySlugs) {
      tags.add(`catalog:${slug}`);
      paths.add(`/category/${slug}`);
    }
  }

  // Explicit home flag always includes home tags (even with product slugs)
  if (body.home === true) {
    tags.add("home");
    tags.add("content");
  }

  const tagList = [...tags];
  const pathList = [...paths];

  // Next.js 16: revalidateTag(tag, profile) — "max" = expire immediately
  for (const tag of tagList) {
    revalidateTag(tag, "max");
  }
  for (const path of pathList) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    revalidated: { tags: tagList, paths: pathList },
  });
}
