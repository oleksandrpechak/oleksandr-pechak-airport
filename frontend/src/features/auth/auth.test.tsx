import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useTokenStore } from '@/lib/api/token-store';
import { routes } from '@/router';
import { mockHttp } from '@/test/http';
import { renderRoutes } from '@/test/render';

const USER = { id: 1, first_name: 'Ada', last_name: 'Lovelace', role: 'USER', email: 'ada@x.io' };
const ADMIN = { ...USER, id: 2, role: 'ADMIN' };

describe('auth flow', () => {
  it('redirects anonymous users to /login and keeps the target in ?next', async () => {
    mockHttp(() => ({ status: 401, data: {} }));
    const { router } = renderRoutes(routes, '/airports');
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?next=%2Fairports');
  });

  it('shows the DRF `detail` message when credentials are wrong', async () => {
    mockHttp((c) =>
      c.url === '/token/'
        ? { status: 401, data: { detail: 'No active account found with the given credentials' } }
        : { status: 404 },
    );
    renderRoutes(routes, '/login');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Email'), 'ada@x.io');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No active account found with the given credentials',
    );
    expect(useTokenStore.getState().access).toBeNull();
  });

  it('signs in, loads /users/me/ and lands on the ?next page', async () => {
    const calls = mockHttp((c) => {
      if (c.url === '/token/') return { status: 200, data: { access: 'a1', refresh: 'r1' } };
      if (c.url === '/users/me/') return { status: 200, data: USER };
      if (c.url === '/aviation/airports/') return { status: 200, data: { count: 0, results: [] } };
      return { status: 404 };
    });
    const { router } = renderRoutes(routes, '/login?next=%2Fairports');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Email'), 'ada@x.io');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { name: 'Airports' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/airports');
    expect(JSON.parse(calls[0]?.data as string)).toEqual({ email: 'ada@x.io', password: 'secret' });
    expect(useTokenStore.getState()).toMatchObject({ access: 'a1', refresh: 'r1' });
    // The refresh token is persisted, the access token never is.
    expect(localStorage.getItem('airport-session')).toContain('r1');
    expect(localStorage.getItem('airport-session')).not.toContain('a1');
  });

  it('puts DRF field errors from sign-up next to the matching inputs', async () => {
    mockHttp((c) =>
      c.url === '/users/customusers/'
        ? { status: 400, data: { email: ['custom user with this Email address already exists.'] } }
        : { status: 404 },
    );
    renderRoutes(routes, '/register');
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@x.io');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.type(screen.getByLabelText('Confirm password'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    const email = screen.getByLabelText('Email');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription(
      'custom user with this Email address already exists.',
    );
  });

  it('blocks non-admins from admin routes', async () => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    mockHttp((c) => (c.url === '/users/me/' ? { status: 200, data: USER } : { status: 404 }));
    renderRoutes(routes, '/admin/users');
    expect(await screen.findByText('Administrator access required')).toBeInTheDocument();
    // …and hides the admin section from navigation.
    expect(screen.queryByRole('link', { name: /Fleet/ })).not.toBeInTheDocument();
  });

  it('lets admins into admin routes', async () => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    mockHttp((c) => (c.url === '/users/me/' ? { status: 200, data: ADMIN } : { status: 404 }));
    renderRoutes(routes, '/admin/users');
    expect(await screen.findByText('Users is on the way')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Fleet/ })).toBeInTheDocument();
  });

  it('signs out from the user menu', async () => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    mockHttp((c) => (c.url === '/users/me/' ? { status: 200, data: USER } : { status: 404 }));
    const { router } = renderRoutes(routes, '/board');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Account menu' }));
    await user.click(await screen.findByRole('menuitem', { name: /Sign out/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(useTokenStore.getState().refresh).toBeNull();
  });
});

describe('command palette', () => {
  it('opens with ⌘K, navigates, and starts empty when reopened', async () => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    mockHttp((c) => (c.url === '/users/me/' ? { status: 200, data: USER } : { status: 404 }));
    const { router } = renderRoutes(routes, '/board');
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'Account menu' });

    await user.keyboard('{Meta>}k{/Meta}');
    const input = await screen.findByPlaceholderText('Type a page or command…');
    await user.type(input, 'payments');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/payments'));

    await user.keyboard('{Meta>}k{/Meta}');
    expect(await screen.findByPlaceholderText('Type a page or command…')).toHaveValue('');
  });

  it('ranks a prefix match first even when it lives in a later section', async () => {
    useTokenStore.setState({ access: 'a', refresh: 'r' });
    mockHttp((c) => (c.url === '/users/me/' ? { status: 200, data: USER } : { status: 404 }));
    renderRoutes(routes, '/board');
    const user = userEvent.setup();
    await screen.findByRole('button', { name: 'Account menu' });

    await user.keyboard('{Meta>}k{/Meta}');
    await user.type(await screen.findByPlaceholderText('Type a page or command…'), 'light');
    // "Flights" also matches (f-light-s) and sits in an earlier section.
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
        'Light theme',
        'Flights',
      ]),
    );
    expect(screen.getByRole('option', { name: 'Light theme' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
