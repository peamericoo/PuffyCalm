import { CategoriesStrip } from "@/components/home/categories-strip";
import { CtaBand } from "@/components/home/cta-band";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";
import { ShopNow } from "@/components/home/shop-now";

export default function HomePage() {
  return (
    <>
      {/* Continuous sky stage — no seam between hero gutter and shop */}
      <div className="shop-stage relative">
        <HeroCarousel />
        <ShopNow />
      </div>

      <div className="relative z-0 bg-background">
        <CategoriesStrip />
        <LifestyleCollections />
        <CtaBand />
      </div>
    </>
  );
}
