import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchList } from '@/lib/api/list';
import type { Airport, AirportListParams } from '@/lib/api/schema';

export const airportKeys = {
  all: ['airports'] as const,
  list: (params: AirportListParams) => [...airportKeys.all, 'list', params] as const,
};

export function useAirports(params: AirportListParams) {
  return useQuery({
    queryKey: airportKeys.list(params),
    queryFn: ({ signal }) => fetchList<Airport>('/aviation/airports/', params, signal),
    placeholderData: keepPreviousData,
  });
}
