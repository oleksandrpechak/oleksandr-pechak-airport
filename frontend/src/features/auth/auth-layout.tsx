import { PlaneTakeoff } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <PlaneTakeoff className="size-4" />
          </span>
          Airport Operations
        </div>
        <div className="space-y-3">
          <p className="max-w-sm text-2xl leading-snug font-semibold text-foreground">
            One console for flights, gates, bookings and payments.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Live departures and arrivals, flight status control and passenger services in a single
            workspace.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Airport Ops</p>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-primary/10 blur-3xl"
        />
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <div className="mb-6 flex items-center gap-2 font-semibold lg:hidden">
              <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
                <PlaneTakeoff className="size-4" />
              </span>
              Airport Operations
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
