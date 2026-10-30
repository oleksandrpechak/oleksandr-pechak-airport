import type { Flight, FlightListParams } from '@/lib/api/schema';
import { addDays, startOfDay } from '@/lib/format';

export type BoardDirection = 'departures' | 'arrivals';

/** The board shows one local calendar day; the API takes at most 100 rows. */
export const BOARD_LIMIT = 100;
export const BOARD_REFRESH_MS = 30_000;

/**
 * API params for one station/day. The flights endpoint only filters on
 * departure time, so arrivals widen the window by a day (overnight flights)
 * and are trimmed to the day on the client with `inBoardWindow`.
 */
export function boardParams(
  station: string,
  direction: BoardDirection,
  day: Date,
): FlightListParams {
  const start = startOfDay(day);
  const end = addDays(start, 1);
  if (direction === 'departures') {
    return {
      departure_iata: station,
      departure_after: start.toISOString(),
      departure_before: end.toISOString(),
      ordering: 'departure_time',
      limit: BOARD_LIMIT,
      offset: 0,
    };
  }
  return {
    arrival_iata: station,
    departure_after: addDays(start, -1).toISOString(),
    departure_before: end.toISOString(),
    ordering: 'arrival_time',
    limit: BOARD_LIMIT,
    offset: 0,
  };
}

export function inBoardWindow(flight: Flight, direction: BoardDirection, day: Date): boolean {
  const start = startOfDay(day).getTime();
  const end = addDays(startOfDay(day), 1).getTime();
  const t = new Date(
    direction === 'departures' ? flight.departure_time : flight.arrival_time,
  ).getTime();
  return t >= start && t < end;
}

/** Scheduled time of the board row, per direction. */
export const boardTime = (flight: Flight, direction: BoardDirection) =>
  direction === 'departures' ? flight.departure_time : flight.arrival_time;
