import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

interface UiState {
  theme: ThemePreference;
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  mobileNavOpen: boolean;
  /** Extra breadcrumb for detail pages ("PS101"); not persisted. */
  pageCrumb: string | null;
  /** Last station picked on the departures/arrivals board. */
  boardStation: string | null;
  setTheme: (theme: ThemePreference) => void;
  toggleSidebar: () => void;
  setCommandOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setPageCrumb: (crumb: string | null) => void;
  setBoardStation: (iata: string) => void;
}

/** Client-only UI state. Server data never lives here — that is TanStack Query's job. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      commandOpen: false,
      mobileNavOpen: false,
      pageCrumb: null,
      boardStation: null,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setPageCrumb: (pageCrumb) => set({ pageCrumb }),
      setBoardStation: (boardStation) => set({ boardStation }),
    }),
    {
      // index.html reads this key before first paint, keep the shape in sync.
      name: 'airport-ui',
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        boardStation: s.boardStation,
      }),
    },
  ),
);

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystemTheme(onChange: () => void) {
  const mql = window.matchMedia(DARK_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function useSystemPrefersDark() {
  return useSyncExternalStore(
    subscribeSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
    () => false,
  );
}

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useUiStore((s) => s.theme);
  const systemDark = useSystemPrefersDark();
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** Show `label` as the last breadcrumb while the calling page is mounted. */
export function usePageCrumb(label: string | undefined) {
  const setPageCrumb = useUiStore((s) => s.setPageCrumb);
  useEffect(() => {
    setPageCrumb(label ?? null);
    return () => setPageCrumb(null);
  }, [label, setPageCrumb]);
}
