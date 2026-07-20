import { Suspense } from "react";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata = {
  title: "Your bag",
  description: "Review your PuffyCalm bag and checkout in one step.",
};

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          Loading bag…
        </div>
      }
    >
      <CartPageView />
    </Suspense>
  );
}
