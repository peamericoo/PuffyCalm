/**
 * Catalog HTTP client — FastAPI read endpoints.
 * Shapes mirror BE camelCase JSON (CatalogPage, Product, Category).
 */

import { getApiBaseUrl } from "@/lib/api/config";
import type { CatalogPage } from "@/lib/catalog/types";
import type { Category, Product, ProductBadge } from "@/types/product";

export class CatalogApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "not_found" | "request_failed" | "invalid_response" = "request_failed",
  ) {
    super(message);
    this.name = "CatalogApiError";
  }
}

const PRODUCT_BADGES = new Set<ProductBadge>([
  "bestseller",
  "new",
  "limited",
  "sale",
]);

function normalizeBadges(raw: unknown): ProductBadge[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const badges = raw.filter(
    (b): b is ProductBadge =>
      typeof b === "string" && PRODUCT_BADGES.has(b as ProductBadge),
  );
  return badges.length > 0 ? badges : undefined;
}

/** Coerce API product JSON into the FE Product type. */
export function normalizeProduct(raw: Record<string, unknown>): Product {
  const images = Array.isArray(raw.images)
    ? (raw.images as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const imageUrl =
    typeof raw.imageUrl === "string" && raw.imageUrl
      ? raw.imageUrl
      : (images[0] ?? "");

  return {
    id: String(raw.id ?? ""),
    slug: String(raw.slug ?? ""),
    name: String(raw.name ?? ""),
    shortDescription: String(raw.shortDescription ?? ""),
    description: String(raw.description ?? ""),
    price: Number(raw.price ?? 0),
    compareAtPrice:
      raw.compareAtPrice == null || raw.compareAtPrice === ""
        ? undefined
        : Number(raw.compareAtPrice),
    currency: "USD",
    categorySlugs: Array.isArray(raw.categorySlugs)
      ? (raw.categorySlugs as unknown[]).map(String)
      : [],
    imageUrl,
    images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
    imageAlt: String(raw.imageAlt ?? raw.name ?? "Product"),
    rating: Number(raw.rating ?? 0),
    reviewCount: Number(raw.reviewCount ?? 0),
    badges: normalizeBadges(raw.badges),
    features: Array.isArray(raw.features)
      ? (raw.features as unknown[]).map(String)
      : [],
    specs: Array.isArray(raw.specs)
      ? (raw.specs as { label?: string; value?: string }[]).map((s) => ({
          label: String(s.label ?? ""),
          value: String(s.value ?? ""),
        }))
      : undefined,
    inStock: Boolean(raw.inStock),
    featured: raw.featured == null ? undefined : Boolean(raw.featured),
    categoryLabel:
      raw.categoryLabel == null ? undefined : String(raw.categoryLabel),
  };
}

export function normalizeCategory(raw: Record<string, unknown>): Category {
  return {
    id: String(raw.id ?? ""),
    slug: String(raw.slug ?? ""),
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    tagline: String(raw.tagline ?? ""),
    imageUrl: String(raw.imageUrl ?? ""),
    ctaLabel: String(raw.ctaLabel ?? "Shop"),
    productCount: Number(raw.productCount ?? 0),
  };
}

function normalizeCatalogPage(raw: Record<string, unknown>): CatalogPage {
  const productsRaw = Array.isArray(raw.products) ? raw.products : [];
  const siblingsRaw = Array.isArray(raw.siblings) ? raw.siblings : [];
  const facetsRaw =
    raw.facets && typeof raw.facets === "object"
      ? (raw.facets as Record<string, unknown>)
      : {};
  const stockRaw =
    facetsRaw.stock && typeof facetsRaw.stock === "object"
      ? (facetsRaw.stock as Record<string, unknown>)
      : {};
  const typesRaw = Array.isArray(facetsRaw.types) ? facetsRaw.types : [];

  return {
    category: normalizeCategory(
      (raw.category && typeof raw.category === "object"
        ? raw.category
        : {}) as Record<string, unknown>,
    ),
    products: productsRaw.map((p) =>
      normalizeProduct(p as Record<string, unknown>),
    ),
    siblings: siblingsRaw.map((c) =>
      normalizeCategory(c as Record<string, unknown>),
    ),
    sort: (raw.sort as CatalogPage["sort"]) || "featured",
    stock: (raw.stock as CatalogPage["stock"]) || "all",
    types: Array.isArray(raw.types) ? (raw.types as string[]) : [],
    sale: Boolean(raw.sale),
    total: Number(raw.total ?? productsRaw.length),
    poolTotal: Number(raw.poolTotal ?? productsRaw.length),
    facets: {
      stock: {
        in: Number(stockRaw.in ?? 0),
        out: Number(stockRaw.out ?? 0),
      },
      types: typesRaw.map((t) => {
        const row = t as Record<string, unknown>;
        return {
          slug: String(row.slug ?? ""),
          name: String(row.name ?? ""),
          count: Number(row.count ?? 0),
        };
      }),
      sale: Number(facetsRaw.sale ?? 0),
    },
  };
}

async function catalogFetch(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
): Promise<Response> {
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

async function parseCatalogError(res: Response): Promise<CatalogApiError> {
  let message = res.statusText || "Catalog request failed";
  try {
    const body = (await res.json()) as { detail?: string | { message?: string } };
    if (typeof body.detail === "string") message = body.detail;
    else if (body.detail && typeof body.detail === "object") {
      message = body.detail.message ?? message;
    }
  } catch {
    /* ignore */
  }
  const code = res.status === 404 ? "not_found" : "request_failed";
  return new CatalogApiError(message, res.status, code);
}

const DEFAULT_REVALIDATE = 60;

/**
 * GET /api/v1/catalog — full category pool (client still filters/sorts).
 * Uses default stock/sale so the shelf is the unfiltered category set.
 */
export async function fetchCatalogPage(
  categorySlug: string,
): Promise<CatalogPage> {
  const slug = categorySlug.trim().toLowerCase() || "all";
  const qs = new URLSearchParams({
    categorySlug: slug,
    sort: "featured",
    stock: "all",
  });
  const res = await catalogFetch(`/api/v1/catalog?${qs.toString()}`, {
    next: { revalidate: DEFAULT_REVALIDATE, tags: ["catalog", `catalog:${slug}`] },
  });
  if (!res.ok) throw await parseCatalogError(res);
  const json = (await res.json()) as Record<string, unknown>;
  return normalizeCatalogPage(json);
}

/** GET /api/v1/categories */
export async function fetchCategories(): Promise<Category[]> {
  const res = await catalogFetch("/api/v1/categories", {
    next: { revalidate: DEFAULT_REVALIDATE, tags: ["catalog", "categories"] },
  });
  if (!res.ok) throw await parseCatalogError(res);
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) {
    throw new CatalogApiError("Invalid categories response", res.status, "invalid_response");
  }
  return json.map((c) => normalizeCategory(c as Record<string, unknown>));
}

export type ProductDetailPayload = {
  product: Product;
  related: Product[];
};

/** GET /api/v1/products/{slug}?related=N */
export async function fetchProductBySlug(
  slug: string,
  related = 4,
): Promise<ProductDetailPayload> {
  const clean = slug.trim().toLowerCase();
  const qs = related > 0 ? `?related=${related}` : "";
  const res = await catalogFetch(`/api/v1/products/${encodeURIComponent(clean)}${qs}`, {
    next: {
      revalidate: DEFAULT_REVALIDATE,
      tags: ["catalog", `product:${clean}`],
    },
  });
  if (!res.ok) throw await parseCatalogError(res);
  const json = (await res.json()) as Record<string, unknown>;
  if (!json.product || typeof json.product !== "object") {
    throw new CatalogApiError("Invalid product response", res.status, "invalid_response");
  }
  const relatedRaw = Array.isArray(json.related) ? json.related : [];
  return {
    product: normalizeProduct(json.product as Record<string, unknown>),
    related: relatedRaw.map((p) =>
      normalizeProduct(p as Record<string, unknown>),
    ),
  };
}
