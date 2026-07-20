import { Suspense } from "react";
import { SuccessView } from "@/components/checkout/success-view";

export const metadata = {
  title: "Order confirmed",
  description: "Your PuffyCalm order is confirmed.",
};

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-20 text-center text-sm text-muted-foreground">
          Confirming order…
        </div>
      }
    >
      <SuccessView />
    </Suspense>
  );
}
