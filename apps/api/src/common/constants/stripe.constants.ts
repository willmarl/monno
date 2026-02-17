// Subscription tier prices
export const STRIPE_SUBSCRIPTION_PRICES = {
  BASIC: {
    id: 'price_1T0CPcGeB83oBgfQrMG997SD',
    productId: 'prod_Ty8hTAgtaYNUZu',
    amount: 999, // cents ($9.99)
    currency: 'usd',
    tier: 'BASIC' as const,
  },
  PRO: {
    id: 'price_1T0CPuGeB83oBgfQ7xeastjr',
    productId: 'prod_Ty8hTAgtaYNUZu',
    amount: 2999, // cents ($29.99)
    currency: 'usd',
    tier: 'PRO' as const,
  },
} as const;

// One-time product purchases (courses, ebooks, videos, etc.)
export const STRIPE_PRODUCT_PRICES = {
  COURSE_A: {
    id: 'price_1T0CQmGeB83oBgfQ3tZ9yIDj',
    productId: 'prod_Ty8iBpo4KQ68dq',
    amount: 2999, // cents ($29.99)
    currency: 'usd',
  },
  COURSE_B: {
    id: 'price_1T0CRYGeB83oBgfQJ0zpRrEu',
    productId: 'prod_Ty8jsLYbXYR9TT',
    amount: 2999, // cents ($29.99)
    currency: 'usd',
  },
} as const;

// Credit packages
export const STRIPE_CREDIT_PRICES = {
  CREDITS_4_99: {
    id: 'price_1T0vCBGeB83oBgfQIKZeYVAe',
    productId: 'prod_Tysytd6aBXzSc2',
    amount: 499, // cents ($4.99)
    currency: 'usd',
    credits: 500,
  },
  CREDITS_9_99: {
    id: 'price_1T0vCeGeB83oBgfQg2UVLerV',
    productId: 'prod_Tysytd6aBXzSc2',
    amount: 999, // cents ($9.99)
    currency: 'usd',
    credits: 1200,
  },
} as const;

// Unified lookup by price ID (for webhook handling)
export const STRIPE_PRICE_LOOKUP = {
  ...Object.fromEntries(
    Object.entries(STRIPE_SUBSCRIPTION_PRICES).map(([_, price]) => [
      price.id,
      { ...price, type: 'subscription' as const },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(STRIPE_PRODUCT_PRICES).map(([_, price]) => [
      price.id,
      { ...price, type: 'product' as const },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(STRIPE_CREDIT_PRICES).map(([_, price]) => [
      price.id,
      { ...price, type: 'credits' as const },
    ]),
  ),
} as const;

// Validation helpers
export const VALID_SUB_PRICE_IDS = Object.values(
  STRIPE_SUBSCRIPTION_PRICES,
).map((p) => p.id);
export const VALID_PRODUCT_PRICE_IDS = Object.values(STRIPE_PRODUCT_PRICES).map(
  (p) => p.id,
);
export const VALID_CREDIT_PRICE_IDS = Object.values(STRIPE_CREDIT_PRICES).map(
  (p) => p.id,
);
export const ALL_VALID_PRICE_IDS = [
  ...VALID_SUB_PRICE_IDS,
  ...VALID_PRODUCT_PRICE_IDS,
  ...VALID_CREDIT_PRICE_IDS,
];

// Get the key name (e.g., 'BASIC', 'COURSE_A', 'CREDITS_4_99') from a price ID
export function getPriceKeyByPriceId(priceId: string): string | undefined {
  const allPrices = [
    ...Object.entries(STRIPE_SUBSCRIPTION_PRICES),
    ...Object.entries(STRIPE_PRODUCT_PRICES),
    ...Object.entries(STRIPE_CREDIT_PRICES),
  ];

  return allPrices.find(([_, price]) => price.id === priceId)?.[0];
}

// Get complete price info: id, name, and category (subscription/product/credits)
export function getPriceInfo(priceId: string) {
  const priceData =
    STRIPE_PRICE_LOOKUP[priceId as keyof typeof STRIPE_PRICE_LOOKUP];
  const priceName = getPriceKeyByPriceId(priceId);

  if (!priceData || !priceName) {
    return undefined;
  }

  return {
    name: priceName,
    category: priceData.type, // 'subscription' | 'product' | 'credits'
    ...priceData, // all other info: amount, tier, credits, etc.
  };
}
