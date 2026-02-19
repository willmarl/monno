import { fetcher } from "@/lib/fetcher";
import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CustomerPortalResponse,
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
