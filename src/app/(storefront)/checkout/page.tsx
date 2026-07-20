import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata = {
  title: "Checkout",
  description: "Secure guest checkout — payments powered by Stripe.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
