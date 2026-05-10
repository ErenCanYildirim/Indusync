"use client";

import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Custom mutation cache to handle global error handling
 */
const createMutationCache = () =>
  new MutationCache({
    onError: (error: any) => {
      // Only show error if it's not handled by the component
      if (!error?.handled) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Ein Fehler ist aufgetreten";
        toast.error(message);
      }
    },
  });

/**
 * Custom query cache for global query error handling
 */
const createQueryCache = () =>
  new QueryCache({
    onError: (error: any) => {
      // Don't show errors for auth-related queries as they're handled elsewhere
      if (
        error?.response?.status === 401 ||
        error?.config?.url?.includes("/auth/")
      ) {
        return;
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Fehler beim Laden der Daten";
      toast.error(message);
    },
  });


/**
 * Create QueryClient with optimized defaults
 */
const createQueryClient = () =>
  new QueryClient({
    queryCache: createQueryCache(),
    mutationCache: createMutationCache(),
    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes

        // GC time: how long unused data stays in cache
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)

        // Retry logic
        retry: (failureCount, error: any) => {
          // Don't retry on auth errors
          if (
            error?.response?.status === 401 ||
            error?.response?.status === 403
          ) {
            return false;
          }

          // Don't retry on validation errors
          if (error?.response?.status === 422) {
            return false;
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },

        // Retry delay (exponential backoff)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch on window focus (useful for keeping data fresh)
        refetchOnWindowFocus: process.env.NODE_ENV === "production",

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Refetch on mount if data is stale
        refetchOnMount: true,
      },
      mutations: {
        // Retry mutations once on network errors
        retry: (failureCount, error: any) => {
          if (error?.code === "NETWORK_ERROR" && failureCount < 1) {
            return true;
          }
          return false;
        },

        // Mutation retry delay
        retryDelay: 1000,
      },
    },
  });

/**
 * QueryProvider component with TanStack Query configuration
 */
export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;