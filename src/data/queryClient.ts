import { QueryClient } from "@tanstack/react-query";

/**
 * The one QueryClient for the app. It is a module singleton (not created inside a component) so that code
 * outside React - the axios 401 handler, logout, the invalidation helpers - can reach the same cache.
 * staleTime is set per hook (see hooks.ts), not here.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
