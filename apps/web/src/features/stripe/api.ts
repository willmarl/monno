import { fetcher } from "@/lib/fetcher";
import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CustomerPortalResponse,
  Subscription,
  ProductPurchase,
  CreditPurchase,
  CreditTransaction,
} from "./types/stripe";

export const createCheckoutSession = (priceId: string) =>
  fetcher<CheckoutSessionResponse>("/stripe/checkout", {
    method: "POST",
    json: { priceId } as CheckoutSessionRequest,
  });

export const createCustomerPortal = () =>
  fetcher<CustomerPortalResponse>("/stripe/customer-portal", {
    method: "POST",
  });

export const getUserSubscription = (userId: number) =>
  fetcher<Subscription>(`/stripe/subscription/${userId}`);

export const getUserAllProducts = (userId: number) =>
  fetcher<ProductPurchase[]>(`/stripe/products/${userId}`);

export const getUserOwnedProducts = (userId: number) =>
  fetcher<ProductPurchase[]>(`/stripe/products/owned/${userId}`);

export const getUserCreditPurchases = (userId: number) =>
  fetcher<CreditPurchase[]>(`/stripe/credit-purchases/${userId}`);

export const getUserCreditTransactions = (userId: number) =>
  fetcher<CreditTransaction[]>(`/stripe/credit-transactions/${userId}`);
