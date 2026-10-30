import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { delay, mockHttp } from '@/test/http';

import { api } from './client';
import { useTokenStore } from './token-store';

describe('api client auth', () => {
  it('sends the in-memory access token as a Bearer header', async () => {
    useTokenStore.setState({ access: 'abc', refresh: 'r' });
    const calls = mockHttp(() => ({ status: 200, data: {} }));
    await api.get('/users/me/');
    expect(calls[0]?.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('runs one refresh for concurrent 401s, then retries every queued request', async () => {
    useTokenStore.setState({ access: 'stale', refresh: 'r1' });
    let refreshCalls = 0;
    mockHttp(async (config) => {
      if (config.url === '/token/refresh/') {
        refreshCalls += 1;
        expect(JSON.parse(config.data as string)).toEqual({ refresh: 'r1' });
        await delay(20);
        return { status: 200, data: { access: 'fresh' } };
      }
      return config.headers.get('Authorization') === 'Bearer fresh'
        ? { status: 200, data: { url: config.url } }
        : { status: 401, data: { detail: 'Given token not valid for any token type' } };
    });

    const results = await Promise.all(['/a/', '/b/', '/c/'].map((url) => api.get(url)));

    expect(refreshCalls).toBe(1);
    expect(results.map((r) => (r.data as { url: string }).url)).toEqual(['/a/', '/b/', '/c/']);
    expect(useTokenStore.getState().access).toBe('fresh');
  });

  it('refreshes on reload, when only the persisted refresh token is known', async () => {
    useTokenStore.setState({ access: null, refresh: 'r1' });
    mockHttp((config) => {
      if (config.url === '/token/refresh/') return { status: 200, data: { access: 'fresh' } };
      return config.headers.get('Authorization') === 'Bearer fresh'
        ? { status: 200, data: { ok: true } }
        : { status: 401, data: { detail: 'Authentication credentials were not provided.' } };
    });
    await expect(api.get('/users/me/')).resolves.toMatchObject({ data: { ok: true } });
  });

  it('clears the session and surfaces the original 401 when refresh fails', async () => {
    useTokenStore.setState({ access: 'stale', refresh: 'expired' });
    const calls = mockHttp((config) =>
      config.url === '/token/refresh/'
        ? { status: 401, data: { detail: 'Token is invalid or expired', code: 'token_not_valid' } }
        : { status: 401, data: { detail: 'expired' } },
    );

    const error = await api.get('/flights/bookings/').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AxiosError);
    expect((error as AxiosError).config?.url).toBe('/flights/bookings/');
    expect(useTokenStore.getState()).toMatchObject({ access: null, refresh: null });
    // original + refresh, and no retry loop
    expect(calls.map((c) => c.url)).toEqual(['/flights/bookings/', '/token/refresh/']);
  });

  it('retries only once, so a 401 after a successful refresh is final', async () => {
    useTokenStore.setState({ access: 'stale', refresh: 'r1' });
    const calls = mockHttp((config) =>
      config.url === '/token/refresh/'
        ? { status: 200, data: { access: 'fresh' } }
        : { status: 401, data: { detail: 'nope' } },
    );
    await expect(api.get('/x/')).rejects.toBeInstanceOf(AxiosError);
    expect(calls.map((c) => c.url)).toEqual(['/x/', '/token/refresh/', '/x/']);
  });

  it('does not try to refresh without a refresh token', async () => {
    const calls = mockHttp(() => ({ status: 401, data: { detail: 'no creds' } }));
    await expect(api.get('/users/me/')).rejects.toBeInstanceOf(AxiosError);
    expect(calls).toHaveLength(1);
  });
});
