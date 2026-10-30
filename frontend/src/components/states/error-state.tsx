import { AlertTriangle, RotateCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { parseApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

export function ErrorState({
  error,
  title = 'Something went wrong',
  onRetry,
  className,
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { message, status } = parseApiError(error);
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-1 grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {message}
        {status ? <span className="ml-1 font-mono text-xs">(HTTP {status})</span> : null}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RotateCw />
          Try again
        </Button>
      )}
    </div>
  );
}
