import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { api, authApi } from '@/lib/api/client';

export interface FakeResponse {
  status: number;
  data?: unknown;
}
type Handler = (config: InternalAxiosRequestConfig) => FakeResponse | Promise<FakeResponse>;

/**
 * Swap the axios adapter on both API instances for a handler. Interceptors still
 * run, so this exercises the real auth/refresh logic. Returns the request log.
 */
export function mockHttp(handler: Handler): InternalAxiosRequestConfig[] {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    calls.push(config);
    const { status, data } = await handler(config);
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400) {
      throw new AxiosError(`HTTP ${status}`, String(status), config, null, response);
    }
    return response;
  };
  api.defaults.adapter = adapter;
  authApi.defaults.adapter = adapter;
  return calls;
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
