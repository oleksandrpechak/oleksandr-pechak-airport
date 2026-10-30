import type { BookingStatus, PaymentStatus } from '@/lib/api/schema';

type Variant = 'secondary' | 'info' | 'success' | 'warning' | 'destructive';

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; variant: Variant }> = {
  PENDING: { label: 'Awaiting payment', variant: 'warning' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'secondary' },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus | 'NONE',
  { label: string; variant: Variant }
> = {
  NONE: { label: 'Not started', variant: 'secondary' },
  PENDING: { label: 'In checkout', variant: 'info' },
  COMPLETED: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  EXPIRED: { label: 'Expired', variant: 'secondary' },
};

export const BOOKING_STATUSES = Object.keys(BOOKING_STATUS_META) as BookingStatus[];

/** "12:04" left until `expiresAt`, or null once it has passed. */
export function timeLeft(expiresAt: string | null, now: number): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return null;
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
