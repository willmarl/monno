export type TierName = "FREE" | "BASIC" | "PRO";

export interface Subscription {
  id: number;
  userId: number;
  stripeId: string;
  tier: TierName;
  nextTier: TierName | null;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED";
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckoutSessionRequest {
  priceId: string;
}

export interface CheckoutSessionResponse {
  url: string | null;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface TierInfo {
  name: TierName;
  amount: number;
  currency: string;
  description?: string;
}
