import type { Booking, BookingTicket } from '@/lib/api/schema';

export interface ItineraryLeg {
  flightId: number;
  flightNumber: string;
  from: string;
  to: string;
  departure: string;
  tickets: BookingTicket[];
}

/** Tickets grouped by flight, earliest departure first. */
export function itinerary(booking: Pick<Booking, 'tickets'>): ItineraryLeg[] {
  const legs = new Map<number, ItineraryLeg>();
  for (const t of booking.tickets) {
    const leg = legs.get(t.flight_id) ?? {
      flightId: t.flight_id,
      flightNumber: t.flight_number,
      from: t.departure_iata,
      to: t.arrival_iata,
      departure: t.departure_time,
      tickets: [],
    };
    leg.tickets.push(t);
    legs.set(t.flight_id, leg);
  }
  return [...legs.values()].sort((a, b) => a.departure.localeCompare(b.departure));
}

export const seatLabels = (tickets: BookingTicket[]) =>
  tickets
    .map((t) => `${t.row}${t.seat}`)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .join(', ');
