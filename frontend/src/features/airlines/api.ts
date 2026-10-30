import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchList } from '@/lib/api/list';
import type { Airline, AirlineListParams } from '@/lib/api/schema';

export const airlineKeys = {
  all: ['airlines'] as const,
  list: (params: AirlineListParams) => [...airlineKeys.all, 'list', params] as const,
};

export function useAirlines(params: AirlineListParams) {
  return useQuery({
    queryKey: airlineKeys.list(params),
    queryFn: ({ signal }) => fetchList<Airline>('/aviation/airlines/', params, signal),
    placeholderData: keepPreviousData,
  });
}
