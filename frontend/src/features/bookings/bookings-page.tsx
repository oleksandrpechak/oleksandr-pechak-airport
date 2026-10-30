import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, Plane } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';

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
import { useCurrentUser } from '@/features/auth/hooks';
import type { Booking } from '@/lib/api/schema';
import { formatMoney, formatShortDate, formatTime } from '@/lib/format';

import { useBookings } from './api';
import { BOOKING_STATUS_META, BOOKING_STATUSES } from './booking-status';
import { Countdown } from './countdown';
import { itinerary, seatLabels } from './itinerary';
import { BookingStatusBadge, PaymentStatusBadge } from './status-badges';

const FILTER_KEYS = ['status'] as const;
const ANY = 'any';

const baseColumns: ColumnDef<Booking>[] = [
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
    id: 'created_at',
    header: 'Created',
    meta: { orderingField: 'created_at', className: 'hidden lg:table-cell' },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatShortDate(row.original.created_at)} {formatTime(row.original.created_at)}
      </span>
    ),
  },
  {
    id: 'itinerary',
    header: 'Itinerary',
    cell: ({ row }) => {
      const legs = itinerary(row.original);
      const first = legs[0];
      if (!first) return <span className="text-muted-foreground">No tickets</span>;
      return (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-semibold">{first.flightNumber}</span>
            <span className="font-mono text-muted-foreground">{first.from}</span>
            <ArrowRight className="size-3 text-muted-foreground" aria-label="to" />
            <span className="font-mono text-muted-foreground">{first.to}</span>
            {legs.length > 1 && (
              <span className="text-xs text-muted-foreground">+{legs.length - 1} more</span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatShortDate(first.departure)} · {formatTime(first.departure)}
          </div>
        </div>
      );
    },
  },
  {
    id: 'seats',
    header: 'Seats',
    cell: ({ row }) => (
      <span
        className="block max-w-40 truncate font-mono text-xs"
        title={seatLabels(row.original.tickets)}
      >
        {seatLabels(row.original.tickets) || '—'}
      </span>
    ),
  },
  {
    id: 'total_price',
    header: 'Total',
    meta: { orderingField: 'total_price', align: 'right' },
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{formatMoney(row.original.total_price)}</span>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
  },
  {
    id: 'payment',
    header: 'Payment',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => <PaymentStatusBadge payment={row.original.payment} />,
  },
  {
    id: 'expires_at',
    header: 'Pay within',
    cell: ({ row }) =>
      row.original.status === 'PENDING' ? (
        <Countdown expiresAt={row.original.expires_at} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

const customerColumn: ColumnDef<Booking> = {
  id: 'user',
  header: 'Customer',
  meta: { className: 'w-24' },
  cell: ({ row }) => <span className="font-mono text-xs">User #{row.original.user}</span>,
};

export function BookingsPage() {
  const user = useCurrentUser();
  const isAdmin = user.role === 'ADMIN';
  const table = useServerTableState({ defaultOrdering: '-created_at' });
  const filters = useUrlFilters(FILTER_KEYS);
  const status = filters.values.status;
  const query = useBookings({ ...table.params, status__iexact: status });

  // Admins see everyone's bookings, so they need to know whose each one is.
  const columns = useMemo(
    () =>
      isAdmin ? [...baseColumns.slice(0, 1), customerColumn, ...baseColumns.slice(1)] : baseColumns,
    [isAdmin],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bookings"
        description={
          isAdmin
            ? 'All bookings across customers. Pending bookings are cancelled automatically when the payment window runs out.'
            : 'Your bookings. Pending bookings must be paid within 30 minutes or the seats are released.'
        }
        actions={
          <Button asChild>
            <Link to="/flights">
              <Plane /> Find a flight
            </Link>
          </Button>
        }
      />
      <DataTable
        label="Bookings"
        columns={columns}
        query={query}
        state={table}
        getRowId={(row) => String(row.id)}
        toolbar={
          <Select
            value={status ?? ANY}
            onValueChange={(v) => filters.setFilter('status', v === ANY ? undefined : v)}
          >
            <SelectTrigger className="w-44" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any status</SelectItem>
              {BOOKING_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BOOKING_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyTitle={status ? 'No bookings with this status' : 'No bookings yet'}
        emptyDescription={
          status
            ? 'Try another status.'
            : 'Open a flight, pick seats on its seat map and book them.'
        }
      />
    </div>
  );
}
