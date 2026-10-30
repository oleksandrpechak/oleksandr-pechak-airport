import { Timer } from 'lucide-react';

import { useNow } from '@/hooks/use-now';
import { cn } from '@/lib/utils';

import { timeLeft } from './booking-status';

/** "Pay within 12:04"; "Expired" once the hold has run out. */
export function Countdown({
  expiresAt,
  className,
}: {
  expiresAt: string | null;
  className?: string;
}) {
  const now = useNow();
  const left = timeLeft(expiresAt, now);
  if (!expiresAt) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 tabular-nums',
        left
          ? 'text-[color-mix(in_oklch,var(--warning)_55%,var(--foreground))]'
          : 'text-muted-foreground',
        className,
      )}
    >
      <Timer className="size-3.5" />
      {left ?? 'Expired'}
    </span>
  );
}
