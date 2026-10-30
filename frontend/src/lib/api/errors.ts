import { AxiosError } from 'axios';

/**
 * A DRF error body, normalised. DRF answers with either `{detail: "..."}`,
 * `{field: ["msg", ...], non_field_errors: [...]}` or nested objects/lists.
 */
export interface ApiError {
  status: number | null;
  /** One human sentence suitable for a toast or a form banner. */
  message: string;
  /** Messages keyed by field path (`"email"`, `"tickets.0.seat"`). */
  fieldErrors: Record<string, string[]>;
  /** Messages that do not belong to a single field (`detail`, `non_field_errors`). */
  formErrors: string[];
}

const FORM_KEYS = new Set(['detail', 'non_field_errors', '__all__']);

function collect(value: unknown, path: string, out: Record<string, string[]>) {
  if (value == null) return;
  if (typeof value === 'string') {
    (out[path] ??= []).push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item, i) =>
      typeof item === 'string' ? collect(item, path, out) : collect(item, `${path}.${i}`, out),
    );
  } else if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      collect(nested, path ? `${path}.${key}` : key, out);
    }
  }
}

function fallbackMessage(status: number | null): string {
  if (status === null) return 'Cannot reach the server. Check your connection and try again.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status >= 500) return 'The server ran into a problem. Please try again later.';
  return 'The request could not be completed.';
}

export function parseApiError(error: unknown): ApiError {
  if (!(error instanceof AxiosError)) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    return { status: null, message, fieldErrors: {}, formErrors: [] };
  }

  const status = error.response?.status ?? null;
  const data: unknown = error.response?.data;
  const all: Record<string, string[]> = {};

  if (typeof data === 'string' && data && !data.trimStart().startsWith('<')) {
    all['detail'] = [data];
  } else if (Array.isArray(data)) {
    collect(data, 'non_field_errors', all);
  } else if (data && typeof data === 'object') {
    collect(data, '', all);
  }

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];
  for (const [key, messages] of Object.entries(all)) {
    if (FORM_KEYS.has(key)) formErrors.push(...messages);
    else fieldErrors[key] = messages;
  }

  const first = formErrors[0] ?? Object.values(fieldErrors)[0]?.[0];
  return { status, message: first ?? fallbackMessage(status), fieldErrors, formErrors };
}
