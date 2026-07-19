import Link from "next/link";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { getFeaturedProducts } from "@/lib/mock/products";

export function FeaturedProducts() {
  const products = getFeaturedProducts().slice(0, 6);

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <SectionHeading
          title="Newly Dropped Essentials"
          description="Curated comfort, recovery, and everyday upgrades — selected to make life feel lighter."
        />
        <ProductGrid products={products} />
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/category/all">See More Collections</Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
