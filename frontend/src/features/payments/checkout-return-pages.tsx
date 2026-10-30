import { CheckCircle2, Clock, CreditCard, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { EmptyState } from '@/components/states/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { recallCheckout, useBooking, useStartCheckout } from '@/features/bookings/api';
import { useNow } from '@/hooks/use-now';
import { parseApiError } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { usePageCrumb } from '@/stores/ui';

/** Stripe's webhook confirms the booking; give it this long before saying so. */
export const CONFIRM_WAIT_MS = 30_000;
const POLL_MS = 2_000;

function BookingLink({ id, label = 'View booking' }: { id: number | null; label?: string }) {
  return (
    <Button asChild variant="outline">
      <Link to={id ? `/bookings/${id}` : '/bookings'}>{id ? label : 'My bookings'}</Link>
    </Button>
  );
}

/** Stripe `success_url`. Waits for the webhook to confirm the booking. */
export function CheckoutSuccessPage() {
  usePageCrumb('Payment received');
  const [bookingId] = useState(recallCheckout);
  const [startedAt] = useState(() => Date.now());
  const now = useNow(1000);
  const waitedOut = now - startedAt > CONFIRM_WAIT_MS;
  const booking = useBooking(bookingId ?? 0, {
    enabled: bookingId !== null,
    refetchInterval: (q) => (q.state.data?.status === 'PENDING' && !waitedOut ? POLL_MS : false),
  });
  const status = booking.data?.status;

  let content;
  if (bookingId === null) {
    content = (
      <EmptyState
        icon={CheckCircle2}
        title="Payment submitted"
        description="Your booking will show as confirmed once the payment is processed."
        action={<BookingLink id={null} />}
      />
    );
  } else if (status === 'CONFIRMED') {
    content = (
      <EmptyState
        icon={CheckCircle2}
        title={`Booking #${bookingId} is confirmed`}
        description={`Payment of ${formatMoney(booking.data?.total_price ?? 0)} received. Your tickets are issued.`}
        action={<BookingLink id={bookingId} label="View tickets" />}
      />
    );
  } else if (status === 'CANCELLED') {
    content = (
      <EmptyState
        icon={XCircle}
        title={`Booking #${bookingId} was cancelled`}
        description="The payment arrived after the booking was cancelled. Contact support for a refund."
        action={<BookingLink id={bookingId} />}
      />
    );
  } else if (waitedOut) {
    content = (
      <EmptyState
        icon={Clock}
        title="Confirmation is taking longer than usual"
        description="Stripe has your payment. The booking updates as soon as the confirmation arrives."
        action={<BookingLink id={bookingId} />}
      />
    );
  } else {
    content = (
      <EmptyState
        icon={Loader2}
        title="Confirming your payment…"
        description="This usually takes a few seconds."
        className="[&_svg]:animate-spin"
      />
    );
  }

  return <Card className="mx-auto mt-8 max-w-lg py-0">{content}</Card>;
}

/** Stripe `cancel_url`. The booking is still pending, so offer to retry. */
export function CheckoutCancelPage() {
  usePageCrumb('Payment cancelled');
  const [bookingId] = useState(recallCheckout);
  const checkout = useStartCheckout();
  return (
    <Card className="mx-auto mt-8 max-w-lg py-0">
      <EmptyState
        icon={XCircle}
        title="Payment not completed"
        description="You left the payment page before paying. Your seats stay held until the payment window runs out."
        action={
          <div className="flex gap-2">
            <BookingLink id={bookingId} />
            {bookingId && (
              <Button
                disabled={checkout.isPending}
                onClick={() =>
                  checkout.mutate(bookingId, {
                    onError: (error) =>
                      toast.error('Could not start the payment', {
                        description: parseApiError(error).message,
                      }),
                  })
                }
              >
                {checkout.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
                Try again
              </Button>
            )}
          </div>
        }
      />
    </Card>
  );
}
