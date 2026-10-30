import { describe, expect, it } from 'vitest';

import { makeFlight } from '@/test/fixtures';

import { boardParams, inBoardWindow } from './board';

const day = new Date(2026, 9, 30); // 30 Oct 2026, local midnight

describe('board params', () => {
  it('asks for one local day of departures from the station', () => {
    const p = boardParams('KBP', 'departures', day);
    expect(p).toMatchObject({
      departure_iata: 'KBP',
      ordering: 'departure_time',
      limit: 100,
      departure_after: new Date(2026, 9, 30).toISOString(),
      departure_before: new Date(2026, 9, 31).toISOString(),
    });
    expect(p.arrival_iata).toBeUndefined();
  });

  it('widens the departure window by a day for arrivals', () => {
    const p = boardParams('WAW', 'arrivals', day);
    expect(p).toMatchObject({
      arrival_iata: 'WAW',
      ordering: 'arrival_time',
      departure_after: new Date(2026, 9, 29).toISOString(),
      departure_before: new Date(2026, 9, 31).toISOString(),
    });
  });

  it('keeps only arrivals that land on the day', () => {
    const overnight = makeFlight({
      departure_time: new Date(2026, 9, 29, 22).toISOString(),
      arrival_time: new Date(2026, 9, 30, 1).toISOString(),
    });
    const yesterday = makeFlight({
      departure_time: new Date(2026, 9, 29, 10).toISOString(),
      arrival_time: new Date(2026, 9, 29, 12).toISOString(),
    });
    expect(inBoardWindow(overnight, 'arrivals', day)).toBe(true);
    expect(inBoardWindow(yesterday, 'arrivals', day)).toBe(false);
    expect(inBoardWindow(overnight, 'departures', day)).toBe(false);
  });
});
