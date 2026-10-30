import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlightDetailPage } from '@/features/flights/flight-detail-page';
import { CheckoutCancelPage, CheckoutSuccessPage } from '@/features/payments/checkout-return-pages';
import { PaymentsPage } from '@/features/payments/payments-page';
import type { Booking } from '@/lib/api/schema';
import { useTokenStore } from '@/lib/api/token-store';
import { goToExternal } from '@/lib/external-navigation';
import { routes } from '@/router';
import { makeFlight, makeSeats, page } from '@/test/fixtures';
import { mockHttp } from '@/test/http';
import { renderRoutes } from '@/test/render';

import { CHECKOUT_STORAGE_KEY } from './api';
import { BookingDetailPage } from './booking-detail-page';

vi.mock('@/lib/external-navigation', () => ({ goToExternal: vi.fn() }));

const USER = { id: 5, first_name: 'Ada', last_name: 'L', role: 'USER', email: 'ada@x.io' };
const ADMIN = { ...USER, id: 1, role: 'ADMIN' };
const future = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 42,
    user: 5,
    created_at: '2026-10-30T10:00:00Z',
    status: 'PENDING',
    total_price: '240.00',
    expires_at: future(20),
    payment: null,
    tickets: [
      {
        id: 7,
        flight_id: 3,
        flight_number: 'PS101',
        departure_iata: 'KBP',
        arrival_iata: 'WAW',
        departure_time: '2026-11-02T08:00:00Z',
        arrival_time: '2026-11-02T09:35:00Z',
        row: 2,
        seat: 'C',
        class_type: 'ECONOMY',
        price: '120.00',
        ticket_status: 'BOOKED',
      },
      {
        id: 8,
        flight_id: 3,
        flight_number: 'PS101',
        departure_iata: 'KBP',
        arrival_iata: 'WAW',
        departure_time: '2026-11-02T08:00:00Z',
        arrival_time: '2026-11-02T09:35:00Z',
        row: 2,
        seat: 'D',
        class_type: 'ECONOMY',
        price: '120.00',
        ticket_status: 'BOOKED',
      },
    ],
    ...overrides,
  };
}

const bookingRoutes = [
  { path: '/bookings/:bookingId', element: <BookingDetailPage /> },
  { path: '/flights/:flightId', element: <FlightDetailPage /> },
];

beforeEach(() => {
  vi.mocked(goToExternal).mockClear();
});

describe('booking seats on a flight', () => {
  it('books the selected seats and opens the new booking', async () => {
    const seats = makeSeats(3, ['A', 'B', 'C', 'D']);
    seats[1]!.ticket_status = 'PAID';
    const calls = mockHttp((c) => {
      if (c.url === '/flights/flights/3/') {
        return {
          status: 200,
          data: makeFlight({ id: 3, departure_time: future(600), arrival_time: future(700) }),
        };
      }
      if (c.url === '/flights/flights/3/seatmap/') return { status: 200, data: seats };
      if (c.url === '/flights/bookings/' && c.method === 'post') {
        return { status: 201, data: makeBooking({ id: 42 }) };
      }
      if (c.url === '/flights/bookings/42/') return { status: 200, data: makeBooking({ id: 42 }) };
      return { status: 404 };
    });
    const { router } = renderRoutes(bookingRoutes, '/flights/3');
    const user = userEvent.setup();

    const grid = await screen.findByRole('grid', { name: 'Seat map' });
    // Taken seats are not buttons; available ones are.
    expect(within(grid).queryByRole('button', { name: /^1B,/ })).not.toBeInTheDocument();
    await user.click(within(grid).getByRole('button', { name: /^2C,/ }));
    await user.click(within(grid).getByRole('button', { name: /^2D,/ }));
    expect(within(grid).getByRole('button', { name: /^2C,/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const selection = screen.getByRole('list', { name: 'Selected seats' });
    expect(within(selection).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('$240.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Book 2 seats' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/bookings/42'));
    const post = calls.find((c) => c.method === 'post');
    expect(JSON.parse(post?.data as string)).toEqual({ ticket_ids: [7, 8] });
  });

  it('refreshes the seat map when a seat was taken meanwhile', async () => {
    const seats = makeSeats(2, ['A', 'B']);
    let seatMapCalls = 0;
    mockHttp((c) => {
      if (c.url === '/flights/flights/3/') {
        return {
          status: 200,
          data: makeFlight({ id: 3, departure_time: future(600), arrival_time: future(700) }),
        };
      }
      if (c.url === '/flights/flights/3/seatmap/') {
        seatMapCalls += 1;
        return { status: 200, data: seats };
      }
      if (c.url === '/flights/bookings/') {
        return { status: 400, data: ['Tickets [1] are not available'] };
      }
      return { status: 404 };
    });
    const { router } = renderRoutes(bookingRoutes, '/flights/3');
    const user = userEvent.setup();
    const grid = await screen.findByRole('grid', { name: 'Seat map' });
    await user.click(within(grid).getByRole('button', { name: /^1A,/ }));
    await user.click(screen.getByRole('button', { name: 'Book 1 seat' }));

    await waitFor(() => expect(seatMapCalls).toBe(2));
    expect(router.state.location.pathname).toBe('/flights/3');
  });

  it('does not offer booking on a cancelled flight', async () => {
    mockHttp((c) => {
      if (c.url === '/flights/flights/3/') {
        return {
          status: 200,
          data: makeFlight({ id: 3, flight_status: 'CANCELLED', departure_time: future(600) }),
        };
      }
      if (c.url === '/flights/flights/3/seatmap/')
        return { status: 200, data: makeSeats(2, ['A', 'B']) };
      return { status: 404 };
    });
    renderRoutes(bookingRoutes, '/flights/3');
    expect(await screen.findByText('This flight is cancelled.')).toBeInTheDocument();
    const grid = await screen.findByRole('grid', { name: 'Seat map' });
    expect(within(grid).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('booking detail', () => {
  it('shows the hold countdown and sends the user to Stripe Checkout', async () => {
    const calls = mockHttp((c) => {
      if (c.url === '/flights/bookings/42/') return { status: 200, data: makeBooking() };
      if (c.url === '/payments/pay/42/') {
        return {
          status: 200,
          data: { chekout_url: 'https://checkout.stripe.com/c/pay/cs_test_123' },
        };
      }
      return { status: 404 };
    });
    renderRoutes(bookingRoutes, '/bookings/42');
    const user = userEvent.setup();

    expect(await screen.findByRole('heading', { name: 'Booking #42' })).toBeInTheDocument();
    expect(screen.getByText(/Seats are held for/)).toHaveTextContent(/1\d:\d\d/);
    expect(within(screen.getByRole('table', { name: 'Tickets' })).getAllByRole('row')).toHaveLength(
      3,
    );

    await user.click(screen.getByRole('button', { name: 'Pay $240.00' }));
    await waitFor(() =>
      expect(goToExternal).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_123'),
    );
    expect(calls.some((c) => c.url === '/payments/pay/42/' && c.method === 'post')).toBe(true);
    expect(sessionStorage.getItem(CHECKOUT_STORAGE_KEY)).toBe('42');
  });

  it('cancels after confirmation and shows the cancelled state', async () => {
    let booking = makeBooking();
    mockHttp((c) => {
      if (c.url === '/flights/bookings/42/cancel/') {
        booking = makeBooking({ status: 'CANCELLED', expires_at: null });
        return { status: 200, data: booking };
      }
      if (c.url === '/flights/bookings/42/') return { status: 200, data: booking };
      return { status: 404 };
    });
    renderRoutes(bookingRoutes, '/bookings/42');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: /Cancel booking/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel booking #42?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel booking' }));

    expect(await screen.findByText(/This booking was cancelled/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay/ })).not.toBeInTheDocument();
  });

  it('shows the confirmed state for a paid booking', async () => {
    mockHttp(() => ({
      status: 200,
      data: makeBooking({
        status: 'CONFIRMED',
        expires_at: null,
        payment: {
          id: 9,
          status: 'COMPLETED',
          amount: '240.00',
          created_at: '2026-10-30T10:05:00Z',
        },
      }),
    }));
    renderRoutes(bookingRoutes, '/bookings/42');
    expect(await screen.findByText(/Paid and confirmed/)).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancel booking/ })).not.toBeInTheDocument();
  });
});

describe('bookings and payments lists', () => {
  const login = (me: typeof USER) => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    return (c: { url?: string }) =>
      c.url === '/users/me/' ? { status: 200, data: me } : undefined;
  };

  it('lists bookings newest first with a status filter, and shows customers to admins', async () => {
    const me = login(ADMIN);
    const calls = mockHttp((c) => me(c) ?? { status: 200, data: page([makeBooking()]) });
    renderRoutes(routes, '/bookings?status=PENDING');

    expect(await screen.findByRole('link', { name: '#42' })).toHaveAttribute(
      'href',
      '/bookings/42',
    );
    expect(screen.getByRole('columnheader', { name: 'Customer' })).toBeInTheDocument();
    expect(screen.getByText('User #5')).toBeInTheDocument();
    expect(screen.getByText('2C, 2D')).toBeInTheDocument();
    expect(calls.filter((c) => c.url === '/flights/bookings/').at(-1)?.params).toEqual({
      limit: 20,
      offset: 0,
      ordering: '-created_at',
      status__iexact: 'PENDING',
    });
  });

  it('hides the customer column from regular users', async () => {
    const me = login(USER);
    mockHttp((c) => me(c) ?? { status: 200, data: page([makeBooking()]) });
    renderRoutes(routes, '/bookings');
    await screen.findByRole('link', { name: '#42' });
    expect(screen.queryByRole('columnheader', { name: 'Customer' })).not.toBeInTheDocument();
  });

  it('shows payment status per booking and a Pay action for pending ones', async () => {
    mockHttp(() => ({
      status: 200,
      data: page([
        makeBooking({ id: 1 }),
        makeBooking({
          id: 2,
          status: 'CONFIRMED',
          expires_at: null,
          payment: {
            id: 9,
            status: 'COMPLETED',
            amount: '240.00',
            created_at: '2026-10-30T10:05:00Z',
          },
        }),
      ]),
    }));
    renderRoutes([{ path: '/payments', element: <PaymentsPage /> }], '/payments');
    const table = await screen.findByRole('table', { name: 'Payments' });
    expect(await within(table).findByText('Not started')).toBeInTheDocument();
    expect(within(table).getByText('Paid')).toBeInTheDocument();
    expect(within(table).getAllByRole('button', { name: 'Pay' })).toHaveLength(1);
  });
});

describe('Stripe return pages', () => {
  it('waits for the webhook, then shows the confirmed booking', async () => {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, '42');
    let polls = 0;
    mockHttp(() => {
      polls += 1;
      return {
        status: 200,
        data: polls < 2 ? makeBooking() : makeBooking({ status: 'CONFIRMED', expires_at: null }),
      };
    });
    renderRoutes(
      [{ path: '/payments/success', element: <CheckoutSuccessPage /> }],
      '/payments/success',
    );
    expect(await screen.findByText('Confirming your payment…')).toBeInTheDocument();
    expect(
      await screen.findByText('Booking #42 is confirmed', {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it('offers to retry the payment after Stripe cancel', async () => {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, '42');
    mockHttp(() => ({
      status: 200,
      data: { chekout_url: 'https://checkout.stripe.com/c/pay/cs_test_456' },
    }));
    renderRoutes(
      [{ path: '/payments/cancel', element: <CheckoutCancelPage /> }],
      '/payments/cancel',
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Try again/ }));
    await waitFor(() =>
      expect(goToExternal).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_456'),
    );
  });

  it('falls back to the bookings list when it does not know the booking', async () => {
    mockHttp(() => ({ status: 404 }));
    await act(async () => {
      renderRoutes(
        [{ path: '/payments/success', element: <CheckoutSuccessPage /> }],
        '/payments/success',
      );
    });
    expect(screen.getByText('Payment submitted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My bookings' })).toHaveAttribute('href', '/bookings');
  });
});
