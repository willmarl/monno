import { toastError } from "@/lib/toast";
import ky from "ky";

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include", // IMPORTANT for cookies - automatically sends httpOnly cookies
  throwHttpErrors: false, // Don't throw on non-ok responses, let fetcher handle it
  hooks: {
    beforeRequest: [
      (request) => {
        // For FormData, remove Content-Type so browser sets multipart/form-data with boundary
        if (request.body instanceof FormData) {
          request.headers.delete("Content-Type");
        } else if (request.body && typeof request.body === "string") {
          // Only set Content-Type for JSON requests
          request.headers.set("Content-Type", "application/json");
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          const clonedResponse = response.clone();
          const error = (await clonedResponse.json().catch(() => ({}))) as {
            message?: string;
          };
          toastError(error.message ?? "Something went wrong");
        }

        if (response.status === 429) {
          // example: show toast
          console.warn("Rate limited");
        }

        if (response.status === 401) {
          // Try refresh
          const refreshResponse = await ky
            .post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
              credentials: "include",
            })
            .catch(() => null);

          if (refreshResponse?.ok) {
            // Retry original request
            return api(request, options);
          }
        }

        return response;
      },
    ],
  },
});
