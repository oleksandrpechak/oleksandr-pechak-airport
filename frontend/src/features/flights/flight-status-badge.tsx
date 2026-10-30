import { Badge } from '@/components/ui/badge';
import type { FlightStatus } from '@/lib/api/schema';

import { FLIGHT_STATUS_META } from './flight-status';

export function FlightStatusBadge({ status = 'SCHEDULED' }: { status?: FlightStatus }) {
  const { label, variant } = FLIGHT_STATUS_META[status];
  return <Badge variant={variant}>{label}</Badge>;
}
