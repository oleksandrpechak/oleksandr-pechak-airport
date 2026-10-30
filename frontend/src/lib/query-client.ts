import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Client errors (4xx) won't fix themselves; retry only network/5xx.
        retry: (failureCount, error) => {
          const status = error instanceof AxiosError ? error.response?.status : undefined;
          if (status !== undefined && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
