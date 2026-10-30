import type { Flight, SeatMapSeat } from '@/lib/api/schema';

let nextId = 1;

export function makeFlight(overrides: Partial<Flight> = {}): Flight {
  const id = overrides.id ?? nextId++;
  return {
    id,
    flight_number: `PS${100 + id}`,
    departure_airport: {
      id: 1,
      name: 'Boryspil International',
      iata_code: 'KBP',
      city: 'Kyiv',
      country_code: 'UA',
    },
    arrival_airport: {
      id: 2,
      name: 'Warsaw Chopin',
      iata_code: 'WAW',
      city: 'Warsaw',
      country_code: 'PL',
    },
    departure_time: '2026-10-30T08:00:00Z',
    arrival_time: '2026-10-30T09:35:00Z',
    ticket_price: '120.00',
    business_price: '180.00',
    business_percent: 50,
    airline_name: { id: 1, name: 'SkyUp' },
    airplane: { id: 1, tail_number: 'UR-SQA', brand: 'Boeing', model: '737-800' },
    flight_status: 'SCHEDULED',
    available_seats: 12,
    created_at: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

export function makeSeats(rows: number, letters: string[], businessRows = 1): SeatMapSeat[] {
  const seats: SeatMapSeat[] = [];
  let id = 1;
  for (let row = 1; row <= rows; row++) {
    for (const seat of letters) {
      seats.push({
        id: id,
        flight_seat: id,
        row,
        seat,
        class_type: row <= businessRows ? 'BUSINESS' : 'ECONOMY',
        price: row <= businessRows ? '180.00' : '120.00',
        ticket_status: 'AVAILABLE',
      });
      id++;
    }
  }
  return seats;
}

export const page = <T>(results: T[], count = results.length) => ({
  count,
  next: null,
  previous: null,
  results,
});
