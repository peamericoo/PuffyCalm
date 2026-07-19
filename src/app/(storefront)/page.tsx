import { CategoriesStrip } from "@/components/home/categories-strip";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesStrip />
      <FeaturedProducts />
      <LifestyleCollections />
    </>
  );
}
