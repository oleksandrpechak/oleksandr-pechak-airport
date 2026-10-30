import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Extra list filters kept in the URL next to the table's own params. Changing
 * a filter resets `offset`, so the user lands on page 1 of the new results.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(
    () =>
      Object.fromEntries(keys.map((k) => [k, searchParams.get(k) ?? undefined])) as Record<
        K,
        string | undefined
      >,
    // keys is expected to be a module-level constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );

  const setFilter = useCallback(
    (key: K, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === undefined || value === '') next.delete(key);
          else next.set(key, value);
          next.delete('offset');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const k of keys) next.delete(k);
        next.delete('offset');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchParams]);

  const activeCount = keys.filter((k) => values[k] !== undefined).length;
  return { values, setFilter, clearFilters, activeCount };
}
