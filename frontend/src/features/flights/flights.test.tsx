import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AirlinesPage } from '@/features/airlines/airlines-page';
import { useTokenStore } from '@/lib/api/token-store';
import { routes } from '@/router';
import { makeFlight, makeSeats, page } from '@/test/fixtures';
import { mockHttp } from '@/test/http';
import { renderRoutes } from '@/test/render';

import { BoardPage } from './board-page';
import { FlightDetailPage } from './flight-detail-page';
import { FlightsPage } from './flights-page';

const lastParams = (calls: { url?: string; params?: unknown }[], url: string) =>
  calls.filter((c) => c.url === url).at(-1)?.params as Record<string, unknown>;

describe('Flights list', () => {
  it('maps URL filters to the flights API and links to the detail page', async () => {
    const flight = makeFlight({ id: 7, flight_number: 'PS101', flight_status: 'DELAYED' });
    const calls = mockHttp(() => ({ status: 200, data: page([flight]) }));
    renderRoutes(
      [{ path: '/flights', element: <FlightsPage /> }],
      '/flights?status=DELAYED&from=kbp&date=2026-10-30&seats=yes',
    );

    const link = await screen.findByRole('link', { name: 'PS101' });
    expect(link).toHaveAttribute('href', '/flights/7');
    expect(within(screen.getByRole('table')).getByText('Delayed')).toBeInTheDocument();
    expect(lastParams(calls, '/flights/flights/')).toEqual({
      limit: 20,
      offset: 0,
      ordering: 'departure_time',
      flight_status: 'DELAYED',
      departure_iata: 'KBP',
      departure_date: '2026-10-30',
      has_available_seats: true,
    });
  });

  it('filters by destination and can clear all filters', async () => {
    const calls = mockHttp(() => ({ status: 200, data: page([makeFlight()]) }));
    const { router } = renderRoutes([{ path: '/flights', element: <FlightsPage /> }], '/flights');
    const user = userEvent.setup();
    await screen.findByRole('link', { name: /PS/ });

    await user.type(screen.getByLabelText('To (IATA)'), 'waw{Enter}');
    await waitFor(() => expect(lastParams(calls, '/flights/flights/').arrival_iata).toBe('WAW'));
    expect(router.state.location.search).toBe('?to=WAW');

    await user.click(screen.getByRole('button', { name: /Clear filters/ }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(lastParams(calls, '/flights/flights/').arrival_iata).toBeUndefined();
  });
});

describe('Flight detail', () => {
  const renderDetail = (path: string) =>
    renderRoutes([{ path: '/flights/:flightId', element: <FlightDetailPage /> }], path);

  it('shows the route, fares and a seat map from the API', async () => {
    const seats = makeSeats(3, ['A', 'B', 'C', 'D']);
    seats[0]!.ticket_status = 'PAID';
    seats[5]!.ticket_status = 'BOOKED';
    seats[6]!.ticket_status = 'CANCELLED';
    mockHttp((c) => {
      if (c.url === '/flights/flights/7/') {
        return {
          status: 200,
          data: makeFlight({ id: 7, flight_number: 'PS101', available_seats: 9 }),
        };
      }
      if (c.url === '/flights/flights/7/seatmap/') return { status: 200, data: seats };
      return { status: 404 };
    });
    renderDetail('/flights/7');

    expect(await screen.findByRole('heading', { name: 'PS101 · KBP → WAW' })).toBeInTheDocument();
    expect(screen.getByText('Boeing 737-800')).toBeInTheDocument();
    expect(screen.getByText('$180.00')).toBeInTheDocument(); // string business_price

    const grid = await screen.findByRole('grid', { name: 'Seat map' });
    expect(within(grid).getAllByRole('gridcell', { name: /, available,/ })).toHaveLength(9);
    expect(
      within(grid).getByRole('gridcell', { name: /^1A, Business, taken/ }),
    ).toBeInTheDocument();
    expect(
      within(grid).getByRole('gridcell', { name: /^2C, Economy, unavailable/ }),
    ).toBeInTheDocument();
    // Business: row 1 has 4 seats, 1 taken. Economy: 8 seats, 1 taken + 1 unavailable.
    expect(screen.getByText('3 / 4')).toBeInTheDocument();
    expect(screen.getByText('6 / 8')).toBeInTheDocument();
  });

  it('says so when the flight does not exist', async () => {
    mockHttp(() => ({ status: 404, data: { detail: 'No Flight matches the given query.' } }));
    renderDetail('/flights/999');
    expect(await screen.findByText('Flight not found')).toBeInTheDocument();
  });
});

describe('Departures & Arrivals board', () => {
  const airports = page([
    {
      id: 1,
      name: 'Boryspil International',
      iata_code: 'KBP',
      city: 1,
      city_name: 'Kyiv',
      country_code: 'UA',
      airline: [],
    },
    {
      id: 2,
      name: 'Warsaw Chopin',
      iata_code: 'WAW',
      city: 2,
      city_name: 'Warsaw',
      country_code: 'PL',
      airline: [],
    },
  ]);

  it('defaults to the first station and today, then switches to arrivals', async () => {
    const now = new Date();
    const departing = makeFlight({
      id: 1,
      flight_number: 'PS201',
      departure_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6).toISOString(),
      arrival_time: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8).toISOString(),
    });
    const calls = mockHttp((c) => {
      if (c.url === '/aviation/airports/') return { status: 200, data: airports };
      return { status: 200, data: page([departing]) };
    });
    const { router } = renderRoutes([{ path: '/board', element: <BoardPage /> }], '/board');
    const user = userEvent.setup();

    expect(await screen.findByRole('link', { name: 'PS201' })).toBeInTheDocument();
    expect(lastParams(calls, '/flights/flights/')).toMatchObject({
      departure_iata: 'KBP',
      ordering: 'departure_time',
      limit: 100,
    });
    expect(screen.getByRole('columnheader', { name: 'Destination' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /Arrivals/ }));
    await waitFor(() =>
      expect(lastParams(calls, '/flights/flights/')).toMatchObject({
        arrival_iata: 'KBP',
        ordering: 'arrival_time',
      }),
    );
    expect(router.state.location.search).toBe('?dir=arrivals');
    expect(await screen.findByRole('columnheader', { name: 'Origin' })).toBeInTheDocument();
  });

  it('shows an empty state for a quiet day', async () => {
    mockHttp((c) =>
      c.url === '/aviation/airports/'
        ? { status: 200, data: airports }
        : { status: 200, data: page([]) },
    );
    renderRoutes(
      [{ path: '/board', element: <BoardPage /> }],
      '/board?station=WAW&date=2026-12-25',
    );
    expect(await screen.findByText('No departures at WAW')).toBeInTheDocument();
  });
});

describe('Airlines', () => {
  it('lists airlines with founded year and status', async () => {
    const calls = mockHttp(() => ({
      status: 200,
      data: page([
        { id: 1, name: 'SkyUp', is_active: true, founded_year: 2016 },
        { id: 2, name: 'Defunct Air', is_active: false, founded_year: null },
      ]),
    }));
    renderRoutes([{ path: '/airlines', element: <AirlinesPage /> }], '/airlines');
    expect(await screen.findByText('SkyUp')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(lastParams(calls, '/aviation/airlines/')).toEqual({
      limit: 20,
      offset: 0,
      ordering: 'name',
    });
  });
});

describe('phase 2 routes', () => {
  it('are live in the navigation, no longer placeholders', async () => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    mockHttp((c) => {
      if (c.url === '/users/me/') {
        return {
          status: 200,
          data: { id: 1, first_name: 'A', last_name: 'B', role: 'USER', email: 'a@b.c' },
        };
      }
      return { status: 200, data: page([]) };
    });
    renderRoutes(routes, '/flights');
    expect(await screen.findByRole('heading', { name: 'Flights' })).toBeInTheDocument();
    expect(screen.queryByText(/is on the way/)).not.toBeInTheDocument();
  });
});
