import { Suspense } from "react";
import { CartPageView } from "@/components/cart/cart-page-view";
import { getProductDetail } from "@/lib/catalog/service";
import type { Product } from "@/types/product";

export const metadata = {
  title: "Your bag",
  description: "Review your PuffyCalm bag and checkout in one step.",
};

type CartPageProps = {
  searchParams: Promise<{ add?: string; qty?: string }>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const sp = await searchParams;
  let prefillProduct: Product | null = null;
  let prefillQty = 1;

  const addSlug = sp.add?.trim();
  if (addSlug) {
    const detail = await getProductDetail(addSlug, 0);
    if (detail) {
      prefillProduct = detail.product;
      const qty = Number(sp.qty ?? "1");
      prefillQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
    }
  }

  return (
    <Suspense
      fallback={
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          Loading bag…
        </div>
      }
    >
      <CartPageView
        prefillProduct={prefillProduct}
        prefillQty={prefillQty}
      />
    </Suspense>
  );
}
