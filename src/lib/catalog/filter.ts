import type { Product } from "@/types/product";
import type { StockFilter } from "@/lib/catalog/types";

export function filterProducts(
  products: Product[],
  opts: {
    q?: string;
    stock: StockFilter;
    types: string[];
    sale: boolean;
    minPrice?: number | null;
    maxPrice?: number | null;
  },
): Product[] {
  const queryTerms =
    opts.q
      ?.trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 8) ?? [];
  return products.filter((p) => {
    if (queryTerms.length > 0) {
      const haystack = [
        p.name,
        p.shortDescription,
        p.description,
        p.categoryLabel,
        ...p.categorySlugs,
        ...p.features,
        ...(p.specs ?? []).flatMap((spec) => [spec.label, spec.value]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!queryTerms.every((term) => haystack.includes(term))) return false;
    }

    if (opts.stock === "in" && !p.inStock) return false;
    if (opts.stock === "out" && p.inStock) return false;

    if (typeof opts.minPrice === "number" && p.price < opts.minPrice) {
      return false;
    }
    if (typeof opts.maxPrice === "number" && p.price > opts.maxPrice) {
      return false;
    }

    if (opts.sale) {
      const onSale = Boolean(
        p.compareAtPrice && p.compareAtPrice > p.price,
      );
      if (!onSale) return false;
    }

    if (opts.types.length > 0) {
      const hit = opts.types.some(
        (t) => t !== "all" && p.categorySlugs.includes(t),
      );
      if (!hit) return false;
    }

    return true;
  });
}

export function buildFacets(
  pool: Product[],
  typeMeta: { slug: string; name: string }[],
) {
  const stock = {
    in: pool.filter((p) => p.inStock).length,
    out: pool.filter((p) => !p.inStock).length,
  };
  const sale = pool.filter(
    (p) => p.compareAtPrice && p.compareAtPrice > p.price,
  ).length;
  const prices = pool.map((p) => p.price).filter(Number.isFinite);
  const price = {
    min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
    max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 0,
  };
  const types = typeMeta
    .filter((t) => t.slug !== "all")
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      count: pool.filter((p) => p.categorySlugs.includes(t.slug)).length,
    }))
    .filter((t) => t.count > 0);

  return { stock, types, sale, price };
}
