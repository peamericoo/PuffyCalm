/**
 * Catalog data access facade — FastAPI only (Phase M).
 *
 * Shapes stay CatalogPage / Product — cart still receives product.id from PDP.
 * Offline / build-time: empty lists or null (no mock fixtures).
 */

import {
  CatalogApiError,
  fetchCatalogPage,
  fetchCategories,
  fetchProductBySlug,
  type ProductDetailPayload,
} from "@/lib/api/catalog";
import type { CatalogPage } from "@/lib/catalog/types";
import type { Category, Product } from "@/types/product";

/** Seed category slugs for generateStaticParams when API is offline at build. */
const BUILD_FALLBACK_CATEGORY_SLUGS = [
  "all",
  "recovery",
  "comfort",
  "everyday",
] as const;

/**
 * Category shelf pool. Returns null when category does not exist (→ notFound).
 * Throws CatalogApiError on transport / 5xx.
 */
export async function getCatalogPage(
  categorySlug: string,
): Promise<CatalogPage | null> {
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
  return fetchCategories();
}

export async function listCatalogSlugs(): Promise<string[]> {
  try {
    const cats = await listCategories();
    if (cats.length > 0) return cats.map((c) => c.slug);
  } catch {
    /* build-time / offline — fall through */
  }
  return [...BUILD_FALLBACK_CATEGORY_SLUGS];
}

/**
 * PDP payload. null → notFound.
 * product.id is the checkout line productId (seed: prod_001…).
 */
export async function getProductDetail(
  slug: string,
  related = 4,
): Promise<ProductDetailPayload | null> {
  try {
    return await fetchProductBySlug(slug, related);
  } catch (err) {
    if (err instanceof CatalogApiError && err.code === "not_found") {
      return null;
    }
    // Build-time DNS/network to API must not fail `next build` (Railway railpack).
    // Runtime still surfaces via error.tsx when the page throws from other paths.
    if (
      err instanceof TypeError ||
      (err instanceof CatalogApiError && err.code === "request_failed")
    ) {
      return null;
    }
    throw err;
  }
}

/** Product slugs for generateStaticParams (API only; empty if offline). */
export async function listProductSlugs(): Promise<string[]> {
  try {
    const page = await fetchCatalogPage("all");
    if (page.products.length > 0) {
      return page.products.map((p) => p.slug);
    }
  } catch {
    /* offline build */
  }
  return [];
}

/**
 * Home “What customers buy first” rail — sale first, then rating.
 * Max 6 items from published catalog. Empty array if API unreachable.
 */
export async function getHomeProductRail(limit = 6): Promise<Product[]> {
  try {
    const page = await fetchCatalogPage("all");
    return [...page.products]
      .sort((a, b) => {
        const saleA = a.compareAtPrice ? 1 : 0;
        const saleB = b.compareAtPrice ? 1 : 0;
        if (saleB !== saleA) return saleB - saleA;
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}

export { CatalogApiError };
