import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  fetchAdminStripeDashboard,
  refundAdminProductPurchase,
  refundAdminCreditPurchase,
  cancelAdminSubscription,
  fetchAdminSubscriptionInvoices,
  sendAdminInvoice,
  voidAdminInvoice,
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
  return useQuery({
    queryKey: ["stripe", "health"],
    queryFn: fetchStripeHealth,
  });
}

//==============
//   Admin
//==============

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

export function useAdminStripeDashboard(limit = 8) {
  return useQuery({
    queryKey: ["admin", "stripe-dashboard", limit],
    queryFn: () => fetchAdminStripeDashboard(limit),
    refetchInterval: 60_000,
  });
}

export function useAdminRefundProductPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => refundAdminProductPurchase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
  });
}

export function useAdminRefundCreditPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => refundAdminCreditPurchase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "credit-purchases"] });
      qc.invalidateQueries({ queryKey: ["admin", "credit-transactions"] });
    },
  });
}

export function useAdminCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      mode,
    }: {
      id: number;
      mode: "period_end" | "immediate";
    }) => cancelAdminSubscription(id, mode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    },
  });
}

export function useAdminSubscriptionInvoices(
  subscriptionId: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin", "subscription-invoices", subscriptionId],
    queryFn: () => fetchAdminSubscriptionInvoices(subscriptionId!),
    enabled: !!subscriptionId && enabled,
  });
}

export function useAdminSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => sendAdminInvoice(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscription-invoices"] });
    },
  });
}

export function useAdminVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => voidAdminInvoice(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "subscription-invoices"] });
    },
  });
}
