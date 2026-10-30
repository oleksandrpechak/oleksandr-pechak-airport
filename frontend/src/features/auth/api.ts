import { api, authApi } from '@/lib/api/client';
import type { CurrentUser, LoginRequest, RegisterRequest, TokenPair } from '@/lib/api/schema';

export async function login(body: LoginRequest): Promise<TokenPair> {
  const { data } = await authApi.post<TokenPair>('/token/', body);
  return data;
}

/** Public sign-up. The backend ignores `role` here, so new accounts are always USER. */
export async function register(body: RegisterRequest): Promise<CurrentUser> {
  const { data } = await authApi.post<CurrentUser>('/users/customusers/', body);
  return data;
}

export async function fetchMe(signal?: AbortSignal): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>('/users/me/', { signal });
  return data;
}
