import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getStripePublishableKey } from "@/lib/api/config";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = getStripePublishableKey();
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}
