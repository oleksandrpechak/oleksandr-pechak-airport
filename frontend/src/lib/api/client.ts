import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import type { RefreshRequest, RefreshResponse } from './schema';
import { useTokenStore } from './token-store';

/**
 * Relative base URL on purpose: Vite proxies `/api` in development and nginx
 * does it in production, so no `VITE_*` API URL is baked into the bundle.
 */
export const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/** Bare instance for token calls, so a failing refresh never re-enters the interceptor. */
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

const AUTH_PATHS = ['/token/', '/token/refresh/'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.request.use((config) => {
  const { access } = useTokenStore.getState();
  if (access) config.headers.set('Authorization', `Bearer ${access}`);
  return config;
});

let refreshInFlight: Promise<string> | null = null;

/**
 * Exchange the refresh token for a new access token. Concurrent callers share
 * one in-flight request, so a burst of 401s triggers exactly one refresh and
 * every waiting request is retried once it resolves.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  const { refresh } = useTokenStore.getState();
  if (!refresh) return Promise.reject(new Error('No refresh token'));

  refreshInFlight = authApi
    .post<RefreshResponse>('/token/refresh/', { refresh } satisfies RefreshRequest)
    .then(({ data }) => {
      useTokenStore.getState().setTokens({ access: data.access });
      return data.access;
    })
    .catch((error: unknown) => {
      useTokenStore.getState().clear();
      throw error;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function bearerOf(config: InternalAxiosRequestConfig): string | null {
  const header = config.headers.get('Authorization');
  return typeof header === 'string' ? header.replace(/^Bearer /, '') : null;
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!(error instanceof AxiosError) || error.response?.status !== 401 || !error.config) {
    throw error;
  }
  const config = error.config as RetriableConfig;
  if (config._retried || AUTH_PATHS.includes(config.url ?? '')) throw error;
  config._retried = true;

  // Another request may already have refreshed while this one was in flight.
  const current = useTokenStore.getState().access;
  if (!current || current === bearerOf(config)) {
    try {
      await refreshAccessToken();
    } catch {
      throw error;
    }
  }
  return api(config);
});
