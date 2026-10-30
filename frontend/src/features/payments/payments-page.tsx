import type { ColumnDef } from '@tanstack/react-table';
import { CreditCard, Loader2 } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { DataTable } from '@/components/data-table/data-table';
import { useServerTableState } from '@/components/data-table/use-server-table-state';
import { useUrlFilters } from '@/components/data-table/use-url-filters';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBookings, useStartCheckout } from '@/features/bookings/api';
import { BOOKING_STATUS_META, BOOKING_STATUSES } from '@/features/bookings/booking-status';
import { BookingStatusBadge, PaymentStatusBadge } from '@/features/bookings/status-badges';
import { parseApiError } from '@/lib/api/errors';
import type { Booking } from '@/lib/api/schema';
import { formatMoney, formatShortDate, formatTime } from '@/lib/format';

const FILTER_KEYS = ['status'] as const;
const ANY = 'any';

function PayButton({ booking }: { booking: Booking }) {
  const checkout = useStartCheckout();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={checkout.isPending}
      onClick={() =>
        checkout.mutate(booking.id, {
          onError: (error) =>
            toast.error('Could not start the payment', {
              description: parseApiError(error).message,
            }),
        })
      }
    >
      {checkout.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
      Pay
    </Button>
  );
}

const columns: ColumnDef<Booking>[] = [
  {
    id: 'id',
    header: 'Booking',
    meta: { className: 'w-24' },
    cell: ({ row }) => (
      <Link
        to={`/bookings/${row.original.id}`}
        className="font-mono font-semibold text-primary hover:underline"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    meta: { orderingField: 'total_price', align: 'right' },
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {formatMoney(row.original.payment?.amount ?? row.original.total_price)}
      </span>
    ),
  },
  {
    id: 'payment_status',
    header: 'Payment',
    cell: ({ row }) => <PaymentStatusBadge payment={row.original.payment} />,
  },
  {
    id: 'payment_started',
    header: 'Started',
    cell: ({ row }) =>
      row.original.payment ? (
        <span className="tabular-nums">
          {formatShortDate(row.original.payment.created_at)}{' '}
          {formatTime(row.original.payment.created_at)}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'booking_status',
    header: 'Booking',
    cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
  },
  {
    id: 'action',
    header: '',
    meta: { align: 'right', className: 'w-24' },
    cell: ({ row }) =>
      row.original.status === 'PENDING' ? <PayButton booking={row.original} /> : null,
  },
];

/**
 * Payments, one row per booking. The API has no payments list, but every
 * booking embeds its payment, so this reads the bookings endpoint.
 */
export function PaymentsPage() {
  const table = useServerTableState({ defaultOrdering: '-created_at' });
  const filters = useUrlFilters(FILTER_KEYS);
  const status = filters.values.status;
  const query = useBookings({ ...table.params, status__iexact: status });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Card payments by booking. Payments run on Stripe Checkout; a booking is confirmed once Stripe reports the payment."
      />
      <DataTable
        label="Payments"
        columns={columns}
        query={query}
        state={table}
        getRowId={(row) => String(row.id)}
        toolbar={
          <Select
            value={status ?? ANY}
            onValueChange={(v) => filters.setFilter('status', v === ANY ? undefined : v)}
          >
            <SelectTrigger className="w-44" aria-label="Booking status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any booking status</SelectItem>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BOOKING_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle="No payments yet"
        emptyDescription="Book seats on a flight, then pay for the booking here or on its page."
      />
    </div>
  );
}
