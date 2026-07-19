import { CategoriesStrip } from "@/components/home/categories-strip";
import { CtaBand } from "@/components/home/cta-band";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";
import { HomeBento } from "@/components/home/home-bento";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <HomeBento />
      <FeaturedProducts />
      <CategoriesStrip />
      <LifestyleCollections />
      <CtaBand />
    </>
  );
}
