import { describe, expect, it } from 'vitest';

import { addDays, formatDuration, parseDateInputValue, toDateInputValue } from './format';

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration('2026-10-30T08:00:00Z', '2026-10-30T09:35:00Z')).toBe('1h 35m');
    expect(formatDuration('2026-10-30T08:00:00Z', '2026-10-30T08:45:00Z')).toBe('45m');
    expect(formatDuration('2026-10-30T22:00:00Z', '2026-10-31T07:05:00Z')).toBe('9h 05m');
  });

  it('round-trips date input values in local time', () => {
    const d = parseDateInputValue('2026-03-29');
    expect(d && toDateInputValue(d)).toBe('2026-03-29');
    expect(d && toDateInputValue(addDays(d, 1))).toBe('2026-03-30');
    expect(parseDateInputValue('29/03/2026')).toBeNull();
    expect(parseDateInputValue(null)).toBeNull();
  });
});
