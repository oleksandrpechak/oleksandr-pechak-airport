import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AirportsPage } from '@/features/airports/airports-page';
import type { Airport } from '@/lib/api/schema';
import { mockHttp } from '@/test/http';
import { renderRoutes } from '@/test/render';

const airports: Airport[] = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  name: `Airport ${i + 1}`,
  iata_code: `A${String(i + 1).padStart(2, '0')}`,
  city: 1,
  city_name: 'Kyiv',
  country_code: 'UA',
  airline: [1, 2],
}));

type Params = { limit: number; offset: number; ordering?: string; search?: string };

function serveAirports() {
  return mockHttp((config) => {
    const { limit, offset, search } = config.params as Params;
    const rows = search ? airports.filter((a) => a.name.endsWith(` ${search}`)) : airports;
    return {
      status: 200,
      data: {
        count: rows.length,
        next: null,
        previous: null,
        results: rows.slice(offset, offset + limit),
      },
    };
  });
}

const renderPage = (path = '/airports') =>
  renderRoutes([{ path: '/airports', element: <AirportsPage /> }], path);

const lastParams = (calls: { params?: unknown }[]) => calls.at(-1)?.params as Params;

describe('DataTable (server-driven)', () => {
  it('requests the first page with DRF params and renders rows', async () => {
    const calls = serveAirports();
    renderPage();
    expect(await screen.findByText('Airport 1')).toBeInTheDocument();
    expect(lastParams(calls)).toEqual({ limit: 20, offset: 0, ordering: 'iata_code' });
    expect(screen.getByText('1–20 of 45')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('maps column sorting to the `ordering` param', async () => {
    const calls = serveAirports();
    const { router } = renderPage();
    const user = userEvent.setup();
    await screen.findByText('Airport 1');

    await user.click(screen.getByRole('button', { name: /Airport/ }));
    await waitFor(() => expect(lastParams(calls).ordering).toBe('name'));
    expect(router.state.location.search).toBe('?ordering=name');

    await user.click(screen.getByRole('button', { name: /Airport/ }));
    await waitFor(() => expect(lastParams(calls).ordering).toBe('-name'));
    expect(
      within(screen.getByRole('table')).getByRole('columnheader', { name: /Airport/ }),
    ).toHaveAttribute('aria-sort', 'descending');
  });

  it('pages with limit/offset', async () => {
    const calls = serveAirports();
    renderPage();
    const user = userEvent.setup();
    await screen.findByText('Airport 1');

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Airport 21')).toBeInTheDocument();
    expect(lastParams(calls)).toMatchObject({ limit: 20, offset: 20 });

    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(await screen.findByText('Airport 45')).toBeInTheDocument();
    expect(lastParams(calls)).toMatchObject({ offset: 40 });
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('reads state from the URL and clamps limit to the DRF max of 100', async () => {
    const calls = serveAirports();
    renderPage('/airports?limit=500&offset=0&ordering=-iata_code');
    await screen.findByText('Airport 1');
    expect(lastParams(calls)).toEqual({ limit: 100, offset: 0, ordering: '-iata_code' });
  });

  it('debounces search, resets to page 1 and shows a no-match state', async () => {
    const calls = serveAirports();
    renderPage('/airports?offset=20');
    const user = userEvent.setup();
    await screen.findByText('Airport 21');

    await user.type(screen.getByRole('searchbox'), '7');
    await waitFor(() => expect(lastParams(calls)).toMatchObject({ search: '7', offset: 0 }));
    expect(await screen.findByText('Airport 7')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(await screen.findByText('No matches for “zzz”')).toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    let fail = true;
    mockHttp(() =>
      fail
        ? { status: 500, data: '<html>oops</html>' }
        : { status: 200, data: { count: 1, results: airports.slice(0, 1) } },
    );
    renderPage();
    const user = userEvent.setup();
    expect(await screen.findByText('Could not load data')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Airport 1')).toBeInTheDocument();
  });
});
