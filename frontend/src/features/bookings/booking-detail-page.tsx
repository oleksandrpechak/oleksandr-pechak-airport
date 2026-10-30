import { AxiosError } from 'axios';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  Ticket,
  XCircle,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cabinLabel } from '@/features/flights/seats';
import { useNow } from '@/hooks/use-now';
import { parseApiError } from '@/lib/api/errors';
import type { Booking } from '@/lib/api/schema';
import { formatLongDate, formatMoney, formatShortDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { usePageCrumb } from '@/stores/ui';

import { useBooking, useCancelBooking, useStartCheckout } from './api';
import { timeLeft } from './booking-status';
import { BookingStatusBadge, PaymentStatusBadge } from './status-badges';

const PENDING_REFRESH_MS = 15_000;

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
      <Link to="/bookings">
        <ArrowLeft /> All bookings
      </Link>
    </Button>
  );
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: 'warning' | 'success' | 'muted';
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 text-sm',
        tone === 'warning' && 'border-warning/40 bg-warning/10',
        tone === 'success' && 'border-success/30 bg-success/10',
        tone === 'muted' && 'bg-muted/50 text-muted-foreground',
      )}
    >
      {icon}
      {children}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

function PendingActions({ booking }: { booking: Booking }) {
  const now = useNow();
  const left = timeLeft(booking.expires_at, now);
  const checkout = useStartCheckout();
  const cancel = useCancelBooking();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pay = () =>
    checkout.mutate(booking.id, {
      onError: (error) =>
        toast.error('Could not start the payment', { description: parseApiError(error).message }),
    });

  const doCancel = () =>
    cancel.mutate(booking.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        toast.success(`Booking #${booking.id} cancelled`, {
          description: 'The seats were released.',
        });
      },
      onError: (error) =>
        toast.error('Could not cancel the booking', { description: parseApiError(error).message }),
    });

  return (
    <Banner tone="warning" icon={<AlertTriangle className="size-4 shrink-0" />}>
      <span className="min-w-0 flex-1">
        {left ? (
          <>
            Seats are held for <strong className="tabular-nums">{left}</strong>. Pay to confirm the
            booking, or the seats are released.
          </>
        ) : (
          'The payment window has passed. This booking will be cancelled automatically.'
        )}
      </span>
      <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={cancel.isPending}>
        <XCircle /> Cancel booking
      </Button>
      <Button onClick={pay} disabled={checkout.isPending}>
        {checkout.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
        Pay {formatMoney(booking.total_price)}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel booking #{booking.id}?</DialogTitle>
            <DialogDescription>
              The {booking.tickets.length} seat{booking.tickets.length === 1 ? '' : 's'} will be
              released for others to book. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep booking
            </Button>
            <Button variant="destructive" onClick={doCancel} disabled={cancel.isPending}>
              {cancel.isPending && <Loader2 className="animate-spin" />}
              Cancel booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Banner>
  );
}

export function BookingDetailPage() {
  const bookingId = Number(useParams().bookingId);
  const valid = Number.isInteger(bookingId) && bookingId > 0;
  const query = useBooking(bookingId, {
    // Pick up the webhook's confirmation or the automatic expiry without a reload.
    refetchInterval: (q) => (q.state.data?.status === 'PENDING' ? PENDING_REFRESH_MS : false),
  });
  usePageCrumb(valid ? `#${bookingId}` : undefined);

  if (!valid || (query.error instanceof AxiosError && query.error.response?.status === 404)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          icon={Ticket}
          title="Booking not found"
          description="It may belong to another account, or the link is wrong."
        />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </div>
    );
  }
  if (query.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <BackLink />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const b = query.data;
  return (
    <div className="space-y-4">
      <BackLink />
      <PageHeader
        title={`Booking #${b.id}`}
        description={`Created ${formatLongDate(new Date(b.created_at))} at ${formatTime(b.created_at)}`}
        actions={<BookingStatusBadge status={b.status} />}
      />

      {b.status === 'PENDING' && <PendingActions booking={b} />}
      {b.status === 'CONFIRMED' && (
        <Banner tone="success" icon={<CheckCircle2 className="size-4 shrink-0 text-success" />}>
          Paid and confirmed. The tickets below are issued.
        </Banner>
      )}
      {b.status === 'CANCELLED' && (
        <Banner tone="muted" icon={<XCircle className="size-4 shrink-0" />}>
          This booking was cancelled and its seats were released.
        </Banner>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-3">
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <Table aria-label="Tickets">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Flight</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Departs</TableHead>
                <TableHead>Seat</TableHead>
                <TableHead className="hidden md:table-cell">Cabin</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {b.tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link
                      to={`/flights/${t.flight_id}`}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {t.flight_number}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono">
                    {t.departure_iata} → {t.arrival_iata}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatShortDate(t.departure_time)} {formatTime(t.departure_time)}
                  </TableCell>
                  <TableCell className="font-mono font-semibold">
                    {t.row}
                    {t.seat}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{cabinLabel(t.class_type)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(t.price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="space-y-4">
          <Card className="gap-2">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Fact label="Seats">{b.tickets.length}</Fact>
                <Fact label="Total">
                  <span className="tabular-nums">{formatMoney(b.total_price)}</span>
                </Fact>
              </dl>
            </CardContent>
          </Card>
          <Card className="gap-2">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Fact label="Status">
                  <PaymentStatusBadge payment={b.payment} />
                </Fact>
                {b.payment && (
                  <>
                    <Fact label="Amount">
                      <span className="tabular-nums">{formatMoney(b.payment.amount)}</span>
                    </Fact>
                    <Fact label="Started">
                      {formatShortDate(b.payment.created_at)} {formatTime(b.payment.created_at)}
                    </Fact>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
