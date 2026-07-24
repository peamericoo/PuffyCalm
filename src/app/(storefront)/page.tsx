import { CategoriesStrip } from "@/components/home/categories-strip";
import { CtaBand } from "@/components/home/cta-band";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { LifestyleCollections } from "@/components/home/lifestyle-collections";
import { ShopNow } from "@/components/home/shop-now";
import { getHomeContent } from "@/lib/api/content";

/** Storefront catalog changes must appear immediately after admin/API publishes. */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function HomePage() {
  const content = await getHomeContent();

  return (
    <>
      {/* Continuous sky stage — no seam between hero gutter and shop */}
      <div className="shop-stage relative">
        <HeroCarousel slides={content.heroSlides} />
        <ShopNow />
      </div>

      <div className="relative z-0 bg-background">
        <CategoriesStrip />
        <LifestyleCollections tiles={content.lifestyleCollections} />
        <CtaBand />
      </div>
    </>
  );
}
