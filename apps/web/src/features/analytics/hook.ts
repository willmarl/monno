import { useMutation } from "@tanstack/react-query";
import { captureBackendEvent } from "./api";
import { CaptureEventPayload } from "./types/analytics";

/**
 * Usage example:
 * const { mutate: captureEvent } = useBackendAnalytics();
 *
 * const handlePurchase = async () => {
 *   await processPurchase();
 *   captureEvent({
 *     eventName: "subscription_activated",
 *     data: { plan: "pro" }
 *   });
 * };
 */
export const useBackendAnalytics = () => {
  return useMutation({
    mutationFn: captureBackendEvent,
    throwOnError: false,
  });
};
