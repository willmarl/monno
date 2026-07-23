import { fetcher } from "@/lib/fetcher";
import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CustomerPortalResponse,
  Subscription,
  SubscriptionList,
  ProductPurchase,
  ProductPurchaseList,
  CreditTransaction,
  CreditTransactionList,
  CreditPurchase,
  CreditPurchaseList,
  StripeInvoiceSummary,
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

// Current user subscription
export const fetchUserSubscription = () =>
  fetcher<Subscription>("/stripe/subscription");

// Current user owned products with pagination
export const fetchUserOwnedProducts = () =>
  fetcher<ProductPurchase[]>("/stripe/products/owned/");

// Current user credit transactions with pagination
export const fetchUserCreditTransactions = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<CreditTransactionList>("/stripe/credit-transactions/", {
    searchParams: { limit, offset },
  });

export const fetchStripeHealth = () => {
  return fetcher("/stripe/health");
};

//==============
//   Admin
//==============
export const fetchAdminSubscriptions = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  status,
  tier,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  status?: string;
  tier?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (status) searchParams.status = status;
  if (tier) searchParams.tier = tier;

  return fetcher<SubscriptionList>("/admin/stripe/subscription", {
    searchParams,
  });
};

export const fetchAdminProducts = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  status,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  status?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (status) searchParams.status = status;

  return fetcher<ProductPurchaseList>("/admin/stripe/products", {
    searchParams,
  });
};

export const fetchAdminCreditPurchases = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<CreditPurchaseList>("/admin/stripe/credit-purchases", {
    searchParams,
  });
};

export const fetchAdminCreditTransactions = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  type,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  type?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (type) searchParams.type = type;

  return fetcher<CreditTransactionList>("/admin/stripe/credit-transactions", {
    searchParams,
  });
};

export type StripeDashboardBalanceBucket = {
  amount: number;
  currency: string;
};

export type StripeDashboardRecentItem = {
  kind: "product" | "credits" | "subscription";
  id: number;
  label: string;
  status: string;
  username: string;
  userId: number;
  amountCents: number | null;
  currency: string | null;
  at: string;
};

export type StripeDashboardOverview = {
  configured: boolean;
  mode: "test" | "live" | null;
  dashboardUrl: string | null;
  balance: {
    available: StripeDashboardBalanceBucket[];
    pending: StripeDashboardBalanceBucket[];
  } | null;
  recent: StripeDashboardRecentItem[];
};

export const fetchAdminStripeDashboard = (limit = 8) =>
  fetcher<StripeDashboardOverview>("/admin/stripe/dashboard", {
    searchParams: { limit },
  });

export const refundAdminProductPurchase = (id: number) =>
  fetcher<{ refunded: boolean; refundId: string; purchaseId: number }>(
    `/admin/stripe/products/${id}/refund`,
    { method: "POST" },
  );

export const refundAdminCreditPurchase = (id: number) =>
  fetcher<{
    refunded: boolean;
    refundId: string;
    purchaseId: number;
    creditsRemoved: number;
  }>(`/admin/stripe/credit-purchases/${id}/refund`, { method: "POST" });

export const cancelAdminSubscription = (
  id: number,
  mode: "period_end" | "immediate",
) =>
  fetcher<{
    canceled: boolean;
    mode: string;
    subscriptionId: number;
    stripeSubscriptionId: string;
  }>(`/admin/stripe/subscriptions/${id}/cancel`, {
    method: "POST",
    json: { mode },
  });

export const fetchAdminSubscriptionInvoices = (id: number, limit = 10) =>
  fetcher<{
    subscriptionId: number;
    username: string;
    items: StripeInvoiceSummary[];
  }>(`/admin/stripe/subscriptions/${id}/invoices`, {
    searchParams: { limit },
  });

export const sendAdminInvoice = (invoiceId: string) =>
  fetcher<{ sent: boolean; invoice: StripeInvoiceSummary }>(
    `/admin/stripe/invoices/${invoiceId}/send`,
    { method: "POST" },
  );

export const voidAdminInvoice = (invoiceId: string) =>
  fetcher<{ voided: boolean; invoice: StripeInvoiceSummary }>(
    `/admin/stripe/invoices/${invoiceId}/void`,
    { method: "POST" },
  );

