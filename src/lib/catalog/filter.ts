import type { Product } from "@/types/product";
import type { StockFilter } from "@/lib/catalog/types";

export function filterProducts(
  products: Product[],
  opts: {
    stock: StockFilter;
    types: string[];
    sale: boolean;
  },
): Product[] {
  return products.filter((p) => {
    if (opts.stock === "in" && !p.inStock) return false;
    if (opts.stock === "out" && p.inStock) return false;

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
  const types = typeMeta
    .filter((t) => t.slug !== "all")
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      count: pool.filter((p) => p.categorySlugs.includes(t.slug)).length,
    }))
    .filter((t) => t.count > 0);

  return { stock, types, sale };
}
