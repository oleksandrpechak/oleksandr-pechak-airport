/**
 * Aliases over the generated OpenAPI types (`src/types/api.d.ts`).
 * Never hand-write a shape the backend owns: derive it from `components` or `paths`.
 */
import type { components, paths } from '@/types/api';

export type Schemas = components['schemas'];

export type CurrentUser = Schemas['CustomUser'];
export type Role = Schemas['RoleEnum'];
export type Airport = Schemas['Airport'];

export type LoginRequest = Pick<Schemas['TokenObtainPair'], 'email' | 'password'>;
export type TokenPair = Pick<Schemas['TokenObtainPair'], 'access' | 'refresh'>;
export type RefreshRequest = Pick<Schemas['TokenRefresh'], 'refresh'>;
export type RefreshResponse = Pick<Schemas['TokenRefresh'], 'access'>;
export type RegisterRequest = Pick<
  Schemas['CustomUser'],
  'email' | 'password' | 'first_name' | 'last_name'
>;

/** DRF `LimitOffsetPagination` envelope, taken from one generated list and made generic. */
export type Paginated<T> = Omit<Schemas['PaginatedAirportList'], 'results'> & { results: T[] };

/** The query params every DRF list view here accepts (limit/offset/ordering/search). */
export type ListParams = Pick<
  NonNullable<paths['/api/aviation/airports/']['get']['parameters']['query']>,
  'limit' | 'offset' | 'ordering' | 'search'
>;

export type AirportListParams = NonNullable<
  paths['/api/aviation/airports/']['get']['parameters']['query']
>;

export type Airline = Schemas['Airline'];
export type AirlineListParams = NonNullable<
  paths['/api/aviation/airlines/']['get']['parameters']['query']
>;

export type Flight = Schemas['FlightRead'];
export type FlightStatus = Schemas['FlightStatusEnum'];
export type FlightAirport = Schemas['FlightAirport'];
export type FlightListParams = NonNullable<
  paths['/api/flights/flights/']['get']['parameters']['query']
>;

/** One seat on a flight: the ticket for it, with seat position and class. */
export type SeatMapSeat = Schemas['SeatMap'];
export type TicketStatus = Schemas['TicketStatusEnum'];
export type SeatClass = Schemas['ClassTypeEnum'];
