import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        mono: 'border-transparent bg-muted font-mono tracking-wide text-foreground',
        info: 'border-primary/25 bg-primary/10 text-primary',
        success: 'border-success/30 bg-success/10 text-success',
        warning:
          'border-warning/40 bg-warning/15 text-[color-mix(in_oklch,var(--warning)_55%,var(--foreground))]',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
