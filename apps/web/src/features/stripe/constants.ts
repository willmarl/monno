// ====================================
// TIER HIERARCHY - Define ordering once from FREE to most expensive
// ====================================
export const TIER_HIERARCHY = ["FREE", "BASIC", "PRO"] as const;
export type TierName = (typeof TIER_HIERARCHY)[number];

// Get numeric level for tier (higher = better)
export function getTierLevel(tier: TierName): number {
  return TIER_HIERARCHY.indexOf(tier);
}

// Check if moving to a better tier
export function isUpgrade(from: TierName, to: TierName): boolean {
  return getTierLevel(to) > getTierLevel(from);
}

// Check if moving to a worse tier
export function isDowngrade(from: TierName, to: TierName): boolean {
  return getTierLevel(to) < getTierLevel(from);
}

// Subscription tier prices
export const STRIPE_SUBSCRIPTION_PRICES = {
  BASIC: {
    id: "price_1T0CPcGeB83oBgfQrMG997SD",
    productId: "prod_Ty8hTAgtaYNUZu",
    amount: 999, // cents ($9.99)
    currency: "usd",
    tier: "BASIC" as const,
  },
  PRO: {
    id: "price_1T0CPuGeB83oBgfQ7xeastjr",
    productId: "prod_Ty8hTAgtaYNUZu",
    amount: 2999, // cents ($29.99)
    currency: "usd",
    tier: "PRO" as const,
  },
} as const;

// One-time product purchases (courses, ebooks, videos, etc.)
export const STRIPE_PRODUCT_PRICES = {
  COURSE_A: {
    id: "price_1T0CQmGeB83oBgfQ3tZ9yIDj",
    productId: "prod_Ty8iBpo4KQ68dq",
    amount: 2999, // cents ($29.99)
    currency: "usd",
  },
  COURSE_B: {
    id: "price_1T0CRYGeB83oBgfQJ0zpRrEu",
    productId: "prod_Ty8jsLYbXYR9TT",
    amount: 2999, // cents ($29.99)
    currency: "usd",
  },
} as const;

// Credit packages
export const STRIPE_CREDIT_PRICES = {
  CREDITS_4_99: {
    id: "price_1T0vCBGeB83oBgfQIKZeYVAe",
    productId: "prod_Tysytd6aBXzSc2",
    amount: 499, // cents ($4.99)
    currency: "usd",
    credits: 500,
  },
  CREDITS_9_99: {
    id: "price_1T0vCeGeB83oBgfQg2UVLerV",
    productId: "prod_Tysytd6aBXzSc2",
    amount: 999, // cents ($9.99)
    currency: "usd",
    credits: 1200,
  },
} as const;
