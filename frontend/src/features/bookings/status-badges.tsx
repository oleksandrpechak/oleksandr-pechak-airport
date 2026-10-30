import { Badge } from '@/components/ui/badge';
import type { BookingPayment, BookingStatus } from '@/lib/api/schema';

import { BOOKING_STATUS_META, PAYMENT_STATUS_META } from './booking-status';

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = BOOKING_STATUS_META[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PaymentStatusBadge({ payment }: { payment: BookingPayment | null }) {
  const { label, variant } = PAYMENT_STATUS_META[payment?.status ?? (payment ? 'PENDING' : 'NONE')];
  return <Badge variant={variant}>{label}</Badge>;
}
