/**
 * Free shipping threshold (USD) — cart UX estimate; BE is source of truth at pay time.
 *
 * Canonical business values (aligned with BE defaults + Railway api prod after Fase D):
 *   FREE_SHIPPING_THRESHOLD = 75  → FREE_SHIPPING_THRESHOLD_CENTS=7500
 *   FLAT_SHIPPING = 6.99           → FLAT_SHIPPING_CENTS=699
 *
 * Smoke SKU `prod_009` ($0.50): alone charges ~$7.49 (product + flat shipping).
 * See docs/ops/CONTRACTS.md §2–3 and docs/phases/PHASE_D_COMPLETE.md.
 */
export const FREE_SHIPPING_THRESHOLD = 75;

/** Flat shipping under threshold (USD). Matches BE `flat_shipping_cents` / 100. */
export const FLAT_SHIPPING = 6.99;

export const CART_CURRENCY = "USD" as const;

/** Max qty per line (matches PDP stepper). */
export const MAX_LINE_QTY = 9;
