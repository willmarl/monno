export const STRIPE_PRODUCTS = {
  PREMIUM_SUBSCRIPTION: "prod_Ty8hTAgtaYNUZu",
  COURSE_A: "prod_Ty8iBpo4KQ68dq",
  COURSE_B: "prod_Ty8jsLYbXYR9TT",
  CREDITS: "prod_Tysytd6aBXzSc2",
} as const;

export const STRIPE_PRICES = {
  PREMIUM_MONTHLY_9_99: "price_1T0CPcGeB83oBgfQrMG997SD",
  PREMIUM_MONTHLY_29_99: "price_1T0CPuGeB83oBgfQ7xeastjr",
  COURSE_A: "price_1T0CQmGeB83oBgfQ3tZ9yIDj",
  COURSE_B: "price_1T0CRYGeB83oBgfQJ0zpRrEu",
  CREDITS_4_99: "price_1T0vCBGeB83oBgfQIKZeYVAe",
  CREDITS_9_99: "price_1T0vCeGeB83oBgfQg2UVLerV",
} as const;

export const STRIPE_TIERS = {
  BASIC: "basic",
  PREMIUM_MONTHLY_9_99: "premium_9_99",
  PREMIUM_MONTHLY_29_99: "premium_29_99",
} as const;
