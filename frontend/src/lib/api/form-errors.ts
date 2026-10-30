import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { parseApiError } from './errors';

/**
 * Put DRF field errors next to their inputs and everything else on the form's
 * `root.server` error. Field errors for fields the form doesn't render are
 * folded into the root message so nothing is silently dropped.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  const parsed = parseApiError(error);
  const rootMessages = [...parsed.formErrors];

  for (const [field, messages] of Object.entries(parsed.fieldErrors)) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: 'server', message: messages.join(' ') });
    } else {
      rootMessages.push(`${field}: ${messages.join(' ')}`);
    }
  }

  if (rootMessages.length > 0 || Object.keys(parsed.fieldErrors).length === 0) {
    setError('root.server', {
      type: 'server',
      message: rootMessages.length > 0 ? rootMessages.join(' ') : parsed.message,
    });
  }
}
