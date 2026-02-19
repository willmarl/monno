import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createCheckoutSession,
  createCustomerPortal,
  getUserSubscription,
  getUserAllProducts,
  getUserOwnedProducts,
  getUserCreditPurchases,
  getUserCreditTransactions,
} from "./api";

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: (priceId: string) => createCheckoutSession(priceId),
    throwOnError: false,
  });
};

export const useCustomerPortal = () => {
  return useMutation({
    mutationFn: createCustomerPortal,
    throwOnError: false,
  });
};

export const useUserSubscription = (userId: number | null) => {
  return useQuery({
    queryKey: ["stripe", "subscription", userId],
    queryFn: () => getUserSubscription(userId!),
    enabled: !!userId,
  });
};

export const useUserAllProducts = (userId: number | null) => {
  return useQuery({
    queryKey: ["stripe", "products", userId],
    queryFn: () => getUserAllProducts(userId!),
    enabled: !!userId,
  });
};

export const useUserOwnedProducts = (userId: number | null) => {
  return useQuery({
    queryKey: ["stripe", "products", "owned", userId],
    queryFn: () => getUserOwnedProducts(userId!),
    enabled: !!userId,
  });
};

export const useUserCreditPurchases = (userId: number | null) => {
  return useQuery({
    queryKey: ["stripe", "credit-purchases", userId],
    queryFn: () => getUserCreditPurchases(userId!),
    enabled: !!userId,
  });
};

export const useUserCreditTransactions = (userId: number | null) => {
  return useQuery({
    queryKey: ["stripe", "credit-transactions", userId],
    queryFn: () => getUserCreditTransactions(userId!),
    enabled: !!userId,
  });
};
