import { useMutation } from "@tanstack/react-query";
import { createCheckoutSession, createCustomerPortal } from "./api";

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
