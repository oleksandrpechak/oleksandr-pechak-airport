import type { FlightStatus } from '@/lib/api/schema';

export const FLIGHT_STATUS_META: Record<
  FlightStatus,
  { label: string; variant: 'secondary' | 'info' | 'success' | 'warning' | 'destructive' }
> = {
  SCHEDULED: { label: 'Scheduled', variant: 'secondary' },
  BOARDING: { label: 'Boarding', variant: 'info' },
  DEPARTED: { label: 'Departed', variant: 'success' },
  DELAYED: { label: 'Delayed', variant: 'warning' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export const FLIGHT_STATUSES = Object.keys(FLIGHT_STATUS_META) as FlightStatus[];
export const flightStatusLabel = (status: FlightStatus) => FLIGHT_STATUS_META[status].label;
