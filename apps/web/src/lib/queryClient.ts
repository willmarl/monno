import { QueryClient } from "@tanstack/react-query";

const shouldRetry = (failureCount: number, error: any) => {
  const statusCode = error?.statusCode;
  // Don't retry on 4xx errors (client errors like 404, 400, 403)
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return false;
  }
  // Retry up to 3 times on 5xx errors (server errors)
  return failureCount < 3;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: false,
      retry: shouldRetry,
      // staleTime, cacheTime, etc.
    },
    mutations: {
      throwOnError: false,
      retry: shouldRetry,
    },
  },
});
