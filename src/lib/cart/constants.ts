/**
 * Free shipping threshold (USD) — cart UX only; BE is source of truth at pay time.
 *
 * CURRENT (smoke): 0 — keeps prod_009 ($0.50) at Stripe minimum when BE env also has
 * FREE_SHIPPING_THRESHOLD_CENTS=0 / FLAT_SHIPPING_CENTS=0 (Railway api prod).
 *
 * CANONICAL business target (restore in Fase D — see docs/ops/CONTRACTS.md):
 *   FREE_SHIPPING_THRESHOLD = 75
 *   FLAT_SHIPPING = 6.99
 * and Railway api: FREE_SHIPPING_THRESHOLD_CENTS=7500, FLAT_SHIPPING_CENTS=699
 *
 * Do not “fix” to 75 while smoke zeros are still intentional on BE prod.
 */
export const FREE_SHIPPING_THRESHOLD = 0;

/** Flat shipping under threshold (USD). 0 while smoke-testing min charge (Fase D). */
export const FLAT_SHIPPING = 0;

export const CART_CURRENCY = "USD" as const;

/** Max qty per line (matches PDP stepper). */
export const MAX_LINE_QTY = 9;
