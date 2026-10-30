import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { hasSession, useTokenStore } from '@/lib/api/token-store';
import type { LoginRequest, RegisterRequest } from '@/lib/api/schema';

import { fetchMe, login, register } from './api';

export const meQueryKey = ['auth', 'me'] as const;

export function useMe() {
  const signedIn = useTokenStore(hasSession);
  return useQuery({
    queryKey: meQueryKey,
    queryFn: ({ signal }) => fetchMe(signal),
    enabled: signedIn,
    staleTime: 5 * 60_000,
  });
}

/** For components rendered under `ProtectedRoute`, where the user is always loaded. */
export function useCurrentUser() {
  const { data } = useMe();
  if (!data) throw new Error('useCurrentUser must be used under <ProtectedRoute>');
  return data;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: async (tokens) => {
      useTokenStore.getState().setTokens(tokens);
      await queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}

export function useRegister() {
  const signIn = useLogin();
  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const user = await register(body);
      await signIn.mutateAsync({ email: body.email, password: body.password });
      return user;
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return () => {
    useTokenStore.getState().clear();
    queryClient.clear();
    navigate('/login', { replace: true });
  };
}

export function userInitials(user: { first_name?: string; last_name?: string; email: string }) {
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.trim();
  return (initials || user.email[0] || '?').toUpperCase();
}

export function userDisplayName(user: { first_name?: string; last_name?: string; email: string }) {
  const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return name || user.email;
}
