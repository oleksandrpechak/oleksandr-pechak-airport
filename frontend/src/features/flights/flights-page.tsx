import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, FilterX } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router';

import { DataTable } from '@/components/data-table/data-table';
import { useServerTableState } from '@/components/data-table/use-server-table-state';
import { useUrlFilters } from '@/components/data-table/use-url-filters';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Flight, FlightListParams, FlightStatus } from '@/lib/api/schema';
import { formatDuration, formatMoney, formatShortDate, formatTime } from '@/lib/format';

import { useFlights } from './api';
import { FLIGHT_STATUSES, flightStatusLabel } from './flight-status';
import { FlightStatusBadge } from './flight-status-badge';

const FILTER_KEYS = ['status', 'from', 'to', 'date', 'seats'] as const;
const ANY = 'any';

function Schedule({ iso }: { iso: string }) {
  return (
    <div className="leading-tight">
      <div className="font-medium tabular-nums">{formatTime(iso)}</div>
      <div className="text-xs text-muted-foreground">{formatShortDate(iso)}</div>
    </div>
  );
}

const columns: ColumnDef<Flight>[] = [
  {
    id: 'flight_number',
    header: 'Flight',
    meta: { orderingField: 'flight_number', className: 'w-36' },
    cell: ({ row }) => (
      <div className="leading-tight">
        <Link
          to={`/flights/${row.original.id}`}
          className="font-mono font-semibold text-primary hover:underline"
        >
          {row.original.flight_number}
        </Link>
        <div className="max-w-32 truncate text-xs text-muted-foreground">
          {row.original.airline_name.name}
        </div>
      </div>
    ),
  },
  {
    id: 'route',
    header: 'Route',
    cell: ({ row }) => {
      const { departure_airport: dep, arrival_airport: arr } = row.original;
      return (
        <div className="flex items-center gap-2">
          <span title={dep.name}>
            <span className="font-mono font-semibold">{dep.iata_code}</span>{' '}
            <span className="hidden text-muted-foreground lg:inline">{dep.city}</span>
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground" aria-label="to" />
          <span title={arr.name}>
            <span className="font-mono font-semibold">{arr.iata_code}</span>{' '}
            <span className="hidden text-muted-foreground lg:inline">{arr.city}</span>
          </span>
        </div>
      );
    },
  },
  {
    id: 'departure_time',
    header: 'Departs',
    meta: { orderingField: 'departure_time' },
    cell: ({ row }) => <Schedule iso={row.original.departure_time} />,
  },
  {
    id: 'arrival_time',
    header: 'Arrives',
    meta: { orderingField: 'arrival_time', className: 'hidden lg:table-cell' },
    cell: ({ row }) => <Schedule iso={row.original.arrival_time} />,
  },
  {
    id: 'duration',
    header: 'Duration',
    meta: { className: 'hidden xl:table-cell' },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatDuration(row.original.departure_time, row.original.arrival_time)}
      </span>
    ),
  },
  {
    id: 'aircraft',
    header: 'Aircraft',
    meta: { className: 'hidden xl:table-cell' },
    cell: ({ row }) => (
      <div className="leading-tight">
        <div>
          {row.original.airplane.brand} {row.original.airplane.model}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {row.original.airplane.tail_number}
        </div>
      </div>
    ),
  },
  {
    id: 'available_seats',
    header: 'Seats left',
    meta: { orderingField: 'available_seats', align: 'right' },
    cell: ({ row }) => {
      const seats = row.original.available_seats;
      return (
        <span className={seats === 0 ? 'text-destructive tabular-nums' : 'tabular-nums'}>
          {seats === 0 ? 'Full' : seats}
        </span>
      );
    },
  },
  {
    id: 'ticket_price',
    header: 'From',
    meta: { orderingField: 'ticket_price', align: 'right' },
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{formatMoney(row.original.ticket_price)}</span>
    ),
  },
  {
    id: 'flight_status',
    header: 'Status',
    meta: { className: 'w-28' },
    cell: ({ row }) => <FlightStatusBadge status={row.original.flight_status} />,
  },
];

const iata = (value: string | undefined) => value?.trim().toUpperCase().slice(0, 3) || undefined;

export function FlightsPage() {
  const table = useServerTableState({ defaultOrdering: 'departure_time' });
  const filters = useUrlFilters(FILTER_KEYS);
  const { status, from, to, date, seats } = filters.values;

  const params = useMemo<FlightListParams>(
    () => ({
      ...table.params,
      flight_status: status as FlightStatus | undefined,
      departure_iata: iata(from),
      arrival_iata: iata(to),
      departure_date: date,
      has_available_seats: seats === 'yes' ? true : undefined,
    }),
    [table.params, status, from, to, date, seats],
  );
  const query = useFlights(params);

  const toolbar = (
    <>
      <Select
        value={status ?? ANY}
        onValueChange={(v) => filters.setFilter('status', v === ANY ? undefined : v)}
      >
        <SelectTrigger className="w-36" aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any status</SelectItem>
          {FLIGHT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {flightStatusLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        aria-label="From (IATA)"
        placeholder="From"
        maxLength={3}
        defaultValue={from}
        key={`from-${from ?? ''}`}
        onBlur={(e) => filters.setFilter('from', iata(e.target.value))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-20 font-mono uppercase placeholder:font-sans placeholder:normal-case"
      />
      <Input
        aria-label="To (IATA)"
        placeholder="To"
        maxLength={3}
        defaultValue={to}
        key={`to-${to ?? ''}`}
        onBlur={(e) => filters.setFilter('to', iata(e.target.value))}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-20 font-mono uppercase placeholder:font-sans placeholder:normal-case"
      />
      <Input
        type="date"
        aria-label="Departure date"
        value={date ?? ''}
        onChange={(e) => filters.setFilter('date', e.target.value || undefined)}
        className="w-40"
      />
      <label className="flex h-8 items-center gap-2 rounded-md border px-2.5 text-sm">
        <input
          type="checkbox"
          className="accent-primary"
          checked={seats === 'yes'}
          onChange={(e) => filters.setFilter('seats', e.target.checked ? 'yes' : undefined)}
        />
        Seats available
      </label>
      {filters.activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={filters.clearFilters}>
          <FilterX /> Clear filters
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Flights"
        description="All scheduled flights. Filter by route, date and status; open a flight for its seat map."
      />
      <DataTable
        label="Flights"
        columns={columns}
        query={query}
        state={table}
        getRowId={(row) => String(row.id)}
        searchPlaceholder="Flight, airport, city or airline…"
        toolbar={toolbar}
        emptyTitle={filters.activeCount > 0 ? 'No flights match these filters' : 'No flights yet'}
        emptyDescription={
          filters.activeCount > 0
            ? 'Try a different date or route, or clear the filters.'
            : 'Flights created by an administrator will appear here.'
        }
      />
    </div>
  );
}
