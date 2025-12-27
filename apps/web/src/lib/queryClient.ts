import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: true,
      // staleTime, cacheTime, etc.
    },
    mutations: {
      throwOnError: true,
    },
  },
});
