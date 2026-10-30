import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { flightKeys } from '@/features/flights/api';
import { api } from '@/lib/api/client';
import { fetchList } from '@/lib/api/list';
import { goToExternal } from '@/lib/external-navigation';
import type {
  Booking,
  BookingCreateRequest,
  BookingListParams,
  CheckoutSession,
} from '@/lib/api/schema';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: (params: BookingListParams) => [...bookingKeys.all, 'list', params] as const,
  detail: (id: number) => [...bookingKeys.all, 'detail', id] as const,
};

export function useBookings(params: BookingListParams) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: ({ signal }) => fetchList<Booking>('/flights/bookings/', params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useBooking(
  id: number,
  options: {
    refetchInterval?: UseQueryOptions<Booking>['refetchInterval'];
    enabled?: boolean;
  } = {},
) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Booking>(`/flights/bookings/${id}/`, { signal });
      return data;
    },
    refetchInterval: options.refetchInterval,
    enabled: options.enabled,
  });
}

/** Seats changed hands: refresh every flight view and every booking list. */
function useInvalidateSeats() {
  const queryClient = useQueryClient();
  return (booking?: Booking) => {
    if (booking) queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
    void queryClient.invalidateQueries({ queryKey: flightKeys.all });
    void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, 'list'] });
  };
}

export function useCreateBooking() {
  const invalidate = useInvalidateSeats();
  return useMutation({
    mutationFn: async (body: BookingCreateRequest) => {
      const { data } = await api.post<Booking>('/flights/bookings/', body);
      return data;
    },
    onSuccess: (booking) => invalidate(booking),
    // A failed booking usually means someone else took a seat: show fresh data.
    onError: () => invalidate(),
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidateSeats();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<Booking>(`/flights/bookings/${id}/cancel/`);
      return data;
    },
    onSuccess: (booking) => invalidate(booking),
  });
}

/** Remembered across the Stripe round trip so the return page knows which booking. */
export const CHECKOUT_STORAGE_KEY = 'airport-checkout-booking';

export function rememberCheckout(bookingId: number) {
  try {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, String(bookingId));
  } catch {
    // Storage blocked: the return page falls back to the bookings list.
  }
}

export function recallCheckout(): number | null {
  try {
    const id = Number(sessionStorage.getItem(CHECKOUT_STORAGE_KEY));
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** Ask the backend for a Stripe Checkout session, then leave the app for it. */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async (bookingId: number) => {
      const { data } = await api.post<CheckoutSession>(`/payments/pay/${bookingId}/`);
      return { bookingId, url: data.chekout_url };
    },
    onSuccess: ({ bookingId, url }) => {
      rememberCheckout(bookingId);
      goToExternal(url);
    },
  });
}
