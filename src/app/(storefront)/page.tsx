import { CategoriesStrip } from "@/components/home/categories-strip";
import { CtaBand } from "@/components/home/cta-band";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";
import { ShopNow } from "@/components/home/shop-now";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <div className="relative z-0 bg-background">
        {/* Immediate product contact for conversion */}
        <ShopNow />
        <CategoriesStrip />
        <LifestyleCollections />
        <CtaBand />
      </div>
    </>
  );
}
