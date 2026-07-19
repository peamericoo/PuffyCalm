import { CategoriesStrip } from "@/components/home/categories-strip";
import { CtaBand } from "@/components/home/cta-band";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";
import { MarqueeStrip } from "@/components/home/marquee-strip";

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarqueeStrip />
      <FeaturedProducts />
      <CategoriesStrip />
      <LifestyleCollections />
      <CtaBand />
    </>
  );
}
