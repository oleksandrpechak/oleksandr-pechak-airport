import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { parseApiError } from './errors';

function httpError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('x', String(status), config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

describe('parseApiError', () => {
  it('reads DRF field errors and non_field_errors', () => {
    const parsed = parseApiError(
      httpError(400, {
        email: ['custom user with this Email address already exists.'],
        non_field_errors: ['Seat already taken.'],
      }),
    );
    expect(parsed.fieldErrors).toEqual({
      email: ['custom user with this Email address already exists.'],
    });
    expect(parsed.formErrors).toEqual(['Seat already taken.']);
    expect(parsed.message).toBe('Seat already taken.');
  });

  it('reads `detail` as a form error', () => {
    const parsed = parseApiError(
      httpError(401, { detail: 'No active account found with the given credentials' }),
    );
    expect(parsed.status).toBe(401);
    expect(parsed.message).toBe('No active account found with the given credentials');
    expect(parsed.fieldErrors).toEqual({});
  });

  it('flattens nested serializer errors into dotted paths', () => {
    const parsed = parseApiError(
      httpError(400, { tickets: [{ seat: ['Invalid seat.'] }, {}], flight: 'Required.' }),
    );
    expect(parsed.fieldErrors).toEqual({
      'tickets.0.seat': ['Invalid seat.'],
      flight: ['Required.'],
    });
  });

  it('falls back to a status message for HTML error pages', () => {
    expect(parseApiError(httpError(502, '<html>Bad gateway</html>')).message).toMatch(/server/i);
  });

  it('describes network failures', () => {
    const err = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(parseApiError(err)).toMatchObject({
      status: null,
      message: expect.stringMatching(/reach/),
    });
  });
});
