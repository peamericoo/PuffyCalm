/**
 * Free shipping threshold (USD).
 * Temporarily 0 so the $0.50 Stripe smoke-test SKU charges the Stripe minimum
 * without +$6.99 shipping. Restore to 75 when finished testing live/test payments.
 */
export const FREE_SHIPPING_THRESHOLD = 0;

/** Flat shipping when under threshold (USD). 0 while smoke-testing min charge. */
export const FLAT_SHIPPING = 0;

export const CART_CURRENCY = "USD" as const;

/** Max qty per line (matches PDP stepper). */
export const MAX_LINE_QTY = 9;
