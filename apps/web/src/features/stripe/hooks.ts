import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createCheckoutSession,
  createCustomerPortal,
  fetchUserSubscription,
  fetchUserOwnedProducts,
  fetchUserCreditTransactions,
  fetchStripeHealth,
  fetchAdminSubscriptions,
  fetchAdminProducts,
  fetchAdminCreditPurchases,
  fetchAdminCreditTransactions,
} from "./api";

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (priceId: string) => createCheckoutSession(priceId),
    throwOnError: false,
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: createCustomerPortal,
    throwOnError: false,
  });
}

// Current user subscription
export function useUserSubscription() {
  return useQuery({
    queryKey: ["stripe", "subscription"],
    queryFn: fetchUserSubscription,
  });
}

// Current user owned products with pagination
export function useUserOwnedProducts() {
  return useQuery({
    queryKey: ["stripe", "products", "owned"],
    queryFn: () => fetchUserOwnedProducts(),
  });
}

// Current user credit transactions with pagination
export function useUserCreditTransactions(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["stripe", "credit-transactions", page],
    queryFn: () => fetchUserCreditTransactions({ limit, offset }),
  });
}

export function useStripeHealth() {
  const cacheKey = "stripe_health_cached";

  // Read from localStorage synchronously for instant render
  const getCachedHealth = () => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    return undefined;
  };

  return useQuery({
    queryKey: ["stripe", "health"],
    queryFn: async () => {
      try {
        const result = await fetchStripeHealth();
        localStorage.setItem(cacheKey, JSON.stringify(result));
        return result;
      } catch (error) {
        // If health check fails, Stripe is not configured
        // Return undefined silently (no toast, no retry)
        return undefined;
      }
    },
    initialData: getCachedHealth(),
    staleTime: Infinity, // Cached data never becomes stale
    retry: false,
  });
}

export function useAdminSubscription(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    status?: string;
    tier?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin",
      "subscriptions",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.status,
      options?.tier,
    ],
    queryFn: () =>
      fetchAdminSubscriptions({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        status: options?.status,
        tier: options?.tier,
      }),
  });
}

export function useAdminProducts(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    status?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin",
      "products",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.status,
    ],
    queryFn: () =>
      fetchAdminProducts({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        status: options?.status,
      }),
  });
}

export function useAdminCreditPurchases(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: { searchFields?: string; sort?: string; caseSensitive?: boolean },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin",
      "credit-purchases",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
    ],
    queryFn: () =>
      fetchAdminCreditPurchases({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
      }),
  });
}

export function useAdminCreditTransactions(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    type?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin",
      "credit-transactions",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.type,
    ],
    queryFn: () =>
      fetchAdminCreditTransactions({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        type: options?.type,
      }),
  });
}
