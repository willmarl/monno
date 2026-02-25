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

  return fetcher<CreditTransactionList>("/admin/stripe/credit-transactions", {
    searchParams,
  });
};
