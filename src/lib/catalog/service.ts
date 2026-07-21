/**
 * Catalog data access facade.
 *
 * Default: FastAPI (`NEXT_PUBLIC_API_URL`).
 * Rollback: set `NEXT_PUBLIC_USE_API_CATALOG=0` to use `src/lib/mock/*`.
 *
 * Shapes stay CatalogPage / Product — cart still receives product.id from PDP.
 */

import {
  CatalogApiError,
  fetchCatalogPage,
  fetchCategories,
  fetchProductBySlug,
  type ProductDetailPayload,
} from "@/lib/api/catalog";
import { buildFacets } from "@/lib/catalog/filter";
import type { CatalogPage } from "@/lib/catalog/types";
import { categories, getCategoryBySlug } from "@/lib/mock/categories";
import {
  getProductBySlug as mockGetProductBySlug,
  getProductsByCategory,
  getRelatedProducts as mockGetRelatedProducts,
  products as mockProducts,
} from "@/lib/mock/products";
import type { Category, Product } from "@/types/product";

const FALLBACK_ALL: Category = {
  id: "cat_all",
  slug: "all",
  name: "All products",
  description: "The full PuffyCalm collection of life-improving essentials.",
  tagline: "Everything we love right now",
  imageUrl:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
  ctaLabel: "Shop All",
  productCount: 0,
};

/**
 * API catalog is ON by default (Phase B).
 * Set NEXT_PUBLIC_USE_API_CATALOG=0|false|off to force mock path.
 */
export function isApiCatalogEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_USE_API_CATALOG?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  return true;
}

function mockCatalogPage(categorySlug: string): CatalogPage | null {
  const slug = categorySlug.trim().toLowerCase() || "all";
  const category =
    getCategoryBySlug(slug) ?? (slug === "all" ? FALLBACK_ALL : null);
  if (!category) return null;

  const pool = getProductsByCategory(slug);
  const facets = buildFacets(
    pool,
    categories.map((c) => ({ slug: c.slug, name: c.name })),
  );
  const siblings = categories.map((c) => ({
    ...c,
    productCount: getProductsByCategory(c.slug).length,
  }));

  return {
    category: {
      ...category,
      productCount: pool.length,
    },
    products: pool,
    siblings,
    sort: "featured",
    stock: "all",
    types: [],
    sale: false,
    total: pool.length,
    poolTotal: pool.length,
    facets,
  };
}

/**
 * Category shelf pool. Returns null when category does not exist (→ notFound).
 * Throws CatalogApiError on transport / 5xx when API mode is on.
 */
export async function getCatalogPage(
  categorySlug: string,
): Promise<CatalogPage | null> {
  if (!isApiCatalogEnabled()) {
    return mockCatalogPage(categorySlug);
  }

  try {
    return await fetchCatalogPage(categorySlug);
  } catch (err) {
    if (err instanceof CatalogApiError && err.code === "not_found") {
      return null;
    }
    throw err;
  }
}

export async function listCategories(): Promise<Category[]> {
  if (!isApiCatalogEnabled()) {
    return categories.map((c) => ({
      ...c,
      productCount: getProductsByCategory(c.slug).length,
    }));
  }
  return fetchCategories();
}

export async function listCatalogSlugs(): Promise<string[]> {
  try {
    const cats = await listCategories();
    if (cats.length > 0) return cats.map((c) => c.slug);
  } catch {
    /* build-time / offline — fall through */
  }
  return categories.map((c) => c.slug);
}

/**
 * PDP payload. null → notFound.
 * product.id is the checkout line productId (seed: prod_001…).
 */
export async function getProductDetail(
  slug: string,
  related = 4,
): Promise<ProductDetailPayload | null> {
  if (!isApiCatalogEnabled()) {
    const product = mockGetProductBySlug(slug);
    if (!product) return null;
    return {
      product,
      related: mockGetRelatedProducts(slug, related),
    };
  }

  try {
    return await fetchProductBySlug(slug, related);
  } catch (err) {
    if (err instanceof CatalogApiError && err.code === "not_found") {
      return null;
    }
    throw err;
  }
}

/** Product slugs for generateStaticParams (API → mock fallback). */
export async function listProductSlugs(): Promise<string[]> {
  if (!isApiCatalogEnabled()) {
    return mockProducts.map((p) => p.slug);
  }
  try {
    const page = await fetchCatalogPage("all");
    if (page.products.length > 0) {
      return page.products.map((p) => p.slug);
    }
  } catch {
    /* offline build */
  }
  return mockProducts.map((p) => p.slug);
}

/**
 * Home “What customers buy first” rail — sale first, then rating.
 * Max 6 items from published catalog.
 */
export async function getHomeProductRail(limit = 6): Promise<Product[]> {
  let pool: Product[];

  if (!isApiCatalogEnabled()) {
    pool = [...mockProducts];
  } else {
    const page = await fetchCatalogPage("all");
    pool = page.products;
  }

  return [...pool]
    .sort((a, b) => {
      const saleA = a.compareAtPrice ? 1 : 0;
      const saleB = b.compareAtPrice ? 1 : 0;
      if (saleB !== saleA) return saleB - saleA;
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    })
    .slice(0, limit);
}

export { CatalogApiError };
