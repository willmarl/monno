import { toastError } from "@/lib/toast";
import ky from "ky";

// Global refresh state (shared across all ky instances)
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;
let onRefreshSuccess: (() => void) | null = null;

export function setRefreshCallback(callback: () => void) {
  onRefreshSuccess = callback;
}

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include",
  throwHttpErrors: false,

  hooks: {
    beforeRequest: [
      (request) => {
        if (request.body instanceof FormData) {
          request.headers.delete("Content-Type");
        } else if (request.body && typeof request.body === "string") {
          request.headers.set("Content-Type", "application/json");
        }
      },
    ],

    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          // Special case: revoking own session from sessions list
          if (request.method === "GET" && request.url.includes("/sessions")) {
            window.location.href = "/login";
            return response;
          }

          // === REFRESH DEDUPLICATION ===
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = ky
              .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                credentials: "include",
              })
              .then((res) => {
                if (!res.ok) throw new Error("Refresh failed");
                return res;
              })
              .finally(() => {
                isRefreshing = false;
                refreshPromise = null;
              });
          }

          try {
            await refreshPromise; // All concurrent 401s wait here

            // Refresh succeeded → notify React Query to invalidate cache
            if (onRefreshSuccess) {
              onRefreshSuccess();
            }

            // Retry original request with fresh tokens
            return api(request);
          } catch (err) {
            // Refresh itself failed → real logout
            toastError("Session expired. Please log in again.");
            return response;
          }
        }

        // Generic 5xx error handling
        // Skip toast for stripe health check (Stripe may not be configured)
        if (
          !response.ok &&
          response.status >= 500 &&
          !request.url.includes("/stripe/health")
        ) {
          const error = (await response
            .clone()
            .json()
            .catch(() => ({}))) as {
            message?: string;
          };
          toastError(error.message ?? "Something went wrong");
        }

        return response;
      },
    ],
  },
});
