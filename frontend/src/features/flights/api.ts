import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { fetchList } from '@/lib/api/list';
import type { Flight, FlightListParams, SeatMapSeat } from '@/lib/api/schema';

export const flightKeys = {
  all: ['flights'] as const,
  list: (params: FlightListParams) => [...flightKeys.all, 'list', params] as const,
  detail: (id: number) => [...flightKeys.all, 'detail', id] as const,
  seatMap: (id: number) => [...flightKeys.all, 'detail', id, 'seatmap'] as const,
};

export function useFlights(
  params: FlightListParams,
  options: { refetchInterval?: number; enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: flightKeys.list(params),
    queryFn: ({ signal }) => fetchList<Flight>('/flights/flights/', params, signal),
    placeholderData: keepPreviousData,
    refetchInterval: options.refetchInterval,
    enabled: options.enabled,
  });
}

export function useFlight(id: number) {
  return useQuery({
    queryKey: flightKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Flight>(`/flights/flights/${id}/`, { signal });
      return data;
    },
  });
}

/** Every seat on the flight (not paginated), ordered by row then letter. */
export function useSeatMap(id: number) {
  return useQuery({
    queryKey: flightKeys.seatMap(id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<SeatMapSeat[]>(`/flights/flights/${id}/seatmap/`, { signal });
      return data;
    },
  });
}
