import { Loader2, Ticket, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cabinLabel } from '@/features/flights/seats';
import { parseApiError } from '@/lib/api/errors';
import type { SeatMapSeat } from '@/lib/api/schema';
import { formatMoney } from '@/lib/format';

import { useCreateBooking } from './api';

export function SeatSelection({
  selected,
  onRemove,
  onClear,
  closedReason,
}: {
  selected: SeatMapSeat[];
  onRemove: (seat: SeatMapSeat) => void;
  onClear: () => void;
  /** Why this flight can't be booked; hides the booking controls. */
  closedReason?: string;
}) {
  const navigate = useNavigate();
  const createBooking = useCreateBooking();
  const total = selected.reduce((sum, s) => sum + Number(s.price), 0);

  const book = async () => {
    try {
      const booking = await createBooking.mutateAsync({ ticket_ids: selected.map((s) => s.id) });
      onClear();
      toast.success(`Booking #${booking.id} created`, {
        description: 'Pay within 30 minutes to keep these seats.',
      });
      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      toast.error('Could not book these seats', { description: parseApiError(error).message });
    }
  };

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Book seats</CardTitle>
        <CardDescription>
          {closedReason ??
            (selected.length === 0
              ? 'Pick available seats on the seat map.'
              : `${selected.length} seat${selected.length === 1 ? '' : 's'} selected`)}
        </CardDescription>
      </CardHeader>
      {!closedReason && selected.length > 0 && (
        <CardContent className="space-y-3">
          <ul className="divide-y rounded-md border" aria-label="Selected seats">
            {selected.map((s) => (
              <li key={s.id} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
                <span className="w-9 font-mono font-semibold">
                  {s.row}
                  {s.seat}
                </span>
                <span className="text-muted-foreground">{cabinLabel(s.class_type)}</span>
                <span className="ml-auto tabular-nums">{formatMoney(s.price)}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove seat ${s.row}${s.seat}`}
                  onClick={() => onRemove(s)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="text-base font-semibold tabular-nums">{formatMoney(total)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClear} disabled={createBooking.isPending}>
              Clear
            </Button>
            <Button
              className="flex-1"
              onClick={() => void book()}
              disabled={createBooking.isPending}
            >
              {createBooking.isPending ? <Loader2 className="animate-spin" /> : <Ticket />}
              Book {selected.length} seat{selected.length === 1 ? '' : 's'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
