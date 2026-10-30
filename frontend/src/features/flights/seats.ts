import type { SeatMapSeat, TicketStatus } from '@/lib/api/schema';

export type SeatState = 'available' | 'taken' | 'blocked';

/** AVAILABLE is free; BOOKED/PAID/USED are taken; a CANCELLED ticket can't be sold. */
export function seatState(status: TicketStatus | undefined): SeatState {
  if (status === undefined || status === 'AVAILABLE') return 'available';
  if (status === 'CANCELLED') return 'blocked';
  return 'taken';
}

export const cabinLabel = (cabin: string) => (cabin === 'BUSINESS' ? 'Business' : 'Economy');

export interface CabinSummary {
  cabin: string;
  total: number;
  available: number;
}

/** Per-cabin totals, business first. */
export function summarizeSeats(seats: SeatMapSeat[]): CabinSummary[] {
  const byCabin = new Map<string, CabinSummary>();
  for (const s of seats) {
    const entry = byCabin.get(s.class_type) ?? { cabin: s.class_type, total: 0, available: 0 };
    entry.total += 1;
    if (seatState(s.ticket_status) === 'available') entry.available += 1;
    byCabin.set(s.class_type, entry);
  }
  return [...byCabin.values()].sort((a, b) =>
    a.cabin === b.cabin ? 0 : a.cabin === 'BUSINESS' ? -1 : 1,
  );
}
