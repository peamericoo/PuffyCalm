import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProductGrid } from "@/components/product/product-grid";
import { getFeaturedProducts } from "@/lib/mock/products";

export function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 4);

  return (
    <section className="bg-white py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Featured"
          title="Most-loved essentials"
          description="A tight collection of high-impact products — chosen for comfort, quality feel, and everyday usefulness."
          href="/category/all"
          linkLabel="Shop all"
        />
        <ProductGrid products={products} />
      </Container>
    </section>
  );
}
