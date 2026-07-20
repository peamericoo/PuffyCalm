import type { Product } from "@/types/product";
import type { CatalogSort } from "@/lib/catalog/types";

/** Pure sort — no I/O. Safe for mock and API-normalized lists. */
export function sortProducts(
  products: Product[],
  sort: CatalogSort,
): Product[] {
  const list = [...products];

  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    case "price-desc":
      return list.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
    case "rating":
      return list.sort(
        (a, b) =>
          b.rating - a.rating ||
          b.reviewCount - a.reviewCount ||
          a.name.localeCompare(b.name),
      );
    case "featured":
    default:
      return list.sort((a, b) => {
        const feat = Number(b.featured) - Number(a.featured);
        if (feat !== 0) return feat;
        const sale =
          Number(Boolean(b.compareAtPrice && b.compareAtPrice > b.price)) -
          Number(Boolean(a.compareAtPrice && a.compareAtPrice > a.price));
        if (sale !== 0) return sale;
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      });
  }
}
