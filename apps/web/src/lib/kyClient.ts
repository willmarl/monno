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
        // Special case for your sessions list
        if (response.status === 401) {
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

            // Retry original request (use native fetch to avoid loop)
            return fetch(request.clone());
          } catch (err) {
            // Refresh itself failed → real logout
            toastError("Session expired. Please log in again.");
            // Optional: clear cookies or redirect
            // window.location.href = "/login";
            return response;
          }
        }

        // Generic 5xx error handling (unchanged)
        if (!response.ok && response.status >= 500) {
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
