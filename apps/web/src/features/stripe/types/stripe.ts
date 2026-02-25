import { PaginatedResponse } from "@/types/pagination";

export type TierName = "FREE" | "BASIC" | "PRO";
export type ProductStatus = "ACTIVE" | "REFUNDED";
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING";
export type CreditTransactionType =
  | "PURCHASE"
  | "SPEND"
  | "REFUND"
  | "ADMIN_ADJUST";

export interface UserInfo {
  id: number;
  username: string;
  avatarPath: string | null;
}

export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  tier: TierName;
  nextTier: TierName | null;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
  user: UserInfo;
}

export type SubscriptionList = PaginatedResponse<Subscription>;

export interface ProductPurchase {
  id: number;
  productId: string;
  status: ProductStatus;
  purchasedAt: Date;
  refundedAt: Date | null;
  user: UserInfo;
}

export type ProductPurchaseList = PaginatedResponse<ProductPurchase>;

export interface CreditPurchase {
  id: number;
  amount: number;
  pricePaid: number;
  currency: string;
  purchasedAt: Date;
}

export type CreditPurchaseList = PaginatedResponse<CreditPurchase>;

export interface CreditTransaction {
  id: number;
  type: CreditTransactionType;
  amount: number;
  reason: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

export type CreditTransactionList = PaginatedResponse<CreditTransaction>;

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
