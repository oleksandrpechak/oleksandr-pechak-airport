import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { useTokenStore } from '@/lib/api/token-store';
import { useUiStore } from '@/stores/ui';

const initialUi = useUiStore.getState();

// Unmount first, then reset stores, so one test's session never leaks into the
// next and no store update hits a mounted tree outside act().
afterEach(() => {
  cleanup();
  useTokenStore.setState({ access: null, refresh: null });
  useUiStore.setState(initialUi, true);
  localStorage.clear();
  sessionStorage.clear();
});

// jsdom lacks these; Radix and our media-query hooks need them.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
