import { Benefits } from "@/components/home/benefits";
import { CategoriesStrip } from "@/components/home/categories-strip";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { PromoBanner } from "@/components/home/promo-banner";

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoriesStrip />
      <FeaturedProducts />
      <PromoBanner />
      <Benefits />
      <Newsletter />
    </>
  );
}
