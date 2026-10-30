import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/** DRF `LimitOffsetPagination.max_limit` on the backend. */
export const MAX_PAGE_SIZE = 100;
/** DRF `PAGE_SIZE` on the backend. */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

export interface ServerTableParams {
  limit: number;
  offset: number;
  ordering?: string;
  search?: string;
}

export interface ServerTableState {
  params: ServerTableParams;
  setPage: (pageIndex: number) => void;
  setPageSize: (size: number) => void;
  setOrdering: (ordering: string | undefined) => void;
  setSearch: (search: string) => void;
}

function toInt(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Table state lives in the URL (`?limit=&offset=&ordering=&search=`) so views
 * are shareable and survive reloads, and maps 1:1 to DRF query params.
 */
export function useServerTableState(
  options: { defaultPageSize?: number; defaultOrdering?: string } = {},
): ServerTableState {
  const { defaultPageSize = DEFAULT_PAGE_SIZE, defaultOrdering } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo<ServerTableParams>(() => {
    const limit = Math.min(
      Math.max(toInt(searchParams.get('limit')) ?? defaultPageSize, 1),
      MAX_PAGE_SIZE,
    );
    const offset = Math.max(toInt(searchParams.get('offset')) ?? 0, 0);
    const ordering = searchParams.get('ordering') ?? defaultOrdering;
    const search = searchParams.get('search')?.trim() || undefined;
    return { limit, offset, ordering: ordering || undefined, search };
  }, [searchParams, defaultPageSize, defaultOrdering]);

  const update = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const isDefault =
              (key === 'limit' && value === defaultPageSize) ||
              (key === 'offset' && value === 0) ||
              (key === 'ordering' && value === (defaultOrdering ?? ''));
            if (value === undefined || value === '' || isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaultPageSize, defaultOrdering],
  );

  return {
    params,
    setPage: useCallback(
      (pageIndex: number) => update({ offset: Math.max(pageIndex, 0) * params.limit }),
      [update, params.limit],
    ),
    setPageSize: useCallback(
      (size: number) => update({ limit: Math.min(Math.max(size, 1), MAX_PAGE_SIZE), offset: 0 }),
      [update],
    ),
    // An explicit "no ordering" must survive a non-empty default, so store ''.
    setOrdering: useCallback(
      (ordering: string | undefined) => update({ ordering: ordering ?? '', offset: 0 }),
      [update],
    ),
    setSearch: useCallback(
      (search: string) => update({ search: search.trim(), offset: 0 }),
      [update],
    ),
  };
}
