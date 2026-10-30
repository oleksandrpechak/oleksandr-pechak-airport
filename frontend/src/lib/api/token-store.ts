import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TokenState {
  /** Short-lived access token. Memory only — never persisted. */
  access: string | null;
  /**
   * Refresh token. Persisted so a reload keeps the session. Moving it to an
   * httpOnly cookie needs a backend change (see README).
   */
  refresh: string | null;
  setTokens: (tokens: { access: string; refresh?: string }) => void;
  clear: () => void;
}

export const useTokenStore = create<TokenState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      setTokens: ({ access, refresh }) => set((s) => ({ access, refresh: refresh ?? s.refresh })),
      clear: () => set({ access: null, refresh: null }),
    }),
    {
      name: 'airport-session',
      partialize: (s) => ({ refresh: s.refresh }),
    },
  ),
);

export const hasSession = (s: Pick<TokenState, 'access' | 'refresh'>) =>
  Boolean(s.access || s.refresh);
