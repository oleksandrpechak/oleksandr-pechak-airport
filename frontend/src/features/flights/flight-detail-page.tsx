import { AxiosError } from 'axios';
import { ArrowLeft, Plane } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Flight, FlightAirport } from '@/lib/api/schema';
import { formatDuration, formatLongDate, formatMoney, formatTime } from '@/lib/format';
import { usePageCrumb } from '@/stores/ui';

import { useFlight, useSeatMap } from './api';
import { FlightStatusBadge } from './flight-status-badge';
import { SeatMap } from './seat-map';
import { cabinLabel, summarizeSeats } from './seats';

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
      <Link to="/flights">
        <ArrowLeft /> All flights
      </Link>
    </Button>
  );
}

function Endpoint({
  airport,
  iso,
  align,
}: {
  airport: FlightAirport;
  iso: string;
  align: 'left' | 'right';
}) {
  return (
    <div className={align === 'right' ? 'text-right' : undefined}>
      <div className="font-mono text-3xl font-semibold tracking-tight">{airport.iata_code}</div>
      <div className="text-sm text-muted-foreground">
        {airport.city}, {airport.country_code}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{formatTime(iso)}</div>
      <div className="text-xs text-muted-foreground">{formatLongDate(new Date(iso))}</div>
      <div className="mt-1 truncate text-xs text-muted-foreground" title={airport.name}>
        {airport.name}
      </div>
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

function RouteCard({ flight }: { flight: Flight }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Endpoint airport={flight.departure_airport} iso={flight.departure_time} align="left" />
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <span className="text-xs tabular-nums">
            {formatDuration(flight.departure_time, flight.arrival_time)}
          </span>
          <div className="flex items-center gap-1">
            <span className="h-px w-10 bg-border sm:w-20" />
            <Plane className="size-4 rotate-45 text-primary" />
            <span className="h-px w-10 bg-border sm:w-20" />
          </div>
          <span className="text-xs">Direct</span>
        </div>
        <Endpoint airport={flight.arrival_airport} iso={flight.arrival_time} align="right" />
      </CardContent>
    </Card>
  );
}

export function FlightDetailPage() {
  const flightId = Number(useParams().flightId);
  const flight = useFlight(flightId);
  const seatMap = useSeatMap(flightId);
  usePageCrumb(flight.data?.flight_number);

  if (
    !Number.isInteger(flightId) ||
    flightId <= 0 ||
    (flight.error instanceof AxiosError && flight.error.response?.status === 404)
  ) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          icon={Plane}
          title="Flight not found"
          description="It may have been removed, or the link is wrong."
        />
      </div>
    );
  }

  if (flight.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState error={flight.error} onRetry={() => void flight.refetch()} />
      </div>
    );
  }

  if (flight.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        <BackLink />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const f = flight.data;
  const cabins = seatMap.data ? summarizeSeats(seatMap.data) : [];

  return (
    <div className="space-y-4">
      <BackLink />
      <PageHeader
        title={`${f.flight_number} · ${f.departure_airport.iata_code} → ${f.arrival_airport.iata_code}`}
        description={`${f.airline_name.name} · ${formatLongDate(new Date(f.departure_time))}`}
        actions={<FlightStatusBadge status={f.flight_status} />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <RouteCard flight={f} />
          <Card>
            <CardHeader>
              <CardTitle>Seat map</CardTitle>
            </CardHeader>
            <CardContent>
              {seatMap.isPending ? (
                <Skeleton className="mx-auto h-80 w-72" />
              ) : seatMap.isError ? (
                <ErrorState
                  error={seatMap.error}
                  title="Could not load the seat map"
                  onRetry={() => void seatMap.refetch()}
                />
              ) : seatMap.data.length === 0 ? (
                <EmptyState
                  title="No seats on this flight"
                  description="The aircraft has no seat layout, so no tickets were issued."
                />
              ) : (
                <SeatMap seats={seatMap.data} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="gap-2">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Fact label="Seats left">
                  <span className="tabular-nums">{f.available_seats}</span>
                </Fact>
                {cabins.map((c) => (
                  <Fact key={c.cabin} label={cabinLabel(c.cabin)}>
                    <span className="tabular-nums">
                      {c.available} / {c.total}
                    </span>
                  </Fact>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card className="gap-2">
            <CardHeader>
              <CardTitle>Fares</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Fact label="Economy">{formatMoney(f.ticket_price)}</Fact>
                <Fact label="Business">{formatMoney(f.business_price)}</Fact>
                <Fact label="Business uplift">+{f.business_percent}%</Fact>
              </dl>
            </CardContent>
          </Card>
          <Card className="gap-2">
            <CardHeader>
              <CardTitle>Aircraft</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Fact label="Type">
                  {f.airplane.brand} {f.airplane.model}
                </Fact>
                <Fact label="Registration">
                  <span className="font-mono">{f.airplane.tail_number}</span>
                </Fact>
                <Fact label="Operator">{f.airline_name.name}</Fact>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
