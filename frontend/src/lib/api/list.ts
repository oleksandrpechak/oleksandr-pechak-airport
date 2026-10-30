import { api } from './client';
import type { ListParams, Paginated } from './schema';

/** GET a DRF paginated list. Empty params are dropped so URLs stay clean. */
export async function fetchList<T>(
  url: string,
  params: ListParams & Record<string, unknown>,
  signal?: AbortSignal,
): Promise<Paginated<T>> {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
  const { data } = await api.get<Paginated<T>>(url, { params: clean, signal });
  return data;
}
