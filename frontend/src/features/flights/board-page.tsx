import { ChevronLeft, ChevronRight, PlaneLanding, PlaneTakeoff, RotateCw } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';

import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAirports } from '@/features/airports/api';
import type { Flight } from '@/lib/api/schema';
import {
  addDays,
  formatLongDate,
  formatTime,
  parseDateInputValue,
  startOfDay,
  toDateInputValue,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui';

import { useFlights } from './api';
import {
  BOARD_LIMIT,
  BOARD_REFRESH_MS,
  boardParams,
  boardTime,
  inBoardWindow,
  type BoardDirection,
} from './board';
import { FlightStatusBadge } from './flight-status-badge';

const STATION_LIST_PARAMS = { limit: 100, offset: 0, ordering: 'iata_code' };

function useBoardState() {
  const [params, setParams] = useSearchParams();
  const remembered = useUiStore((s) => s.boardStation);
  const setRemembered = useUiStore((s) => s.setBoardStation);

  const direction: BoardDirection = params.get('dir') === 'arrivals' ? 'arrivals' : 'departures';
  const day = parseDateInputValue(params.get('date')) ?? startOfDay(new Date());
  const station = params.get('station')?.toUpperCase() ?? remembered ?? undefined;

  const update = (patch: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === undefined) next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );

  return {
    direction,
    day,
    station,
    setDirection: (d: BoardDirection) => update({ dir: d === 'departures' ? undefined : d }),
    setDay: (d: Date) => {
      const isToday = toDateInputValue(d) === toDateInputValue(new Date());
      update({ date: isToday ? undefined : toDateInputValue(d) });
    },
    setStation: (iata: string) => {
      setRemembered(iata);
      update({ station: iata });
    },
  };
}

export function BoardPage() {
  const board = useBoardState();
  const stations = useAirports(STATION_LIST_PARAMS);
  const firstStation = stations.data?.results[0]?.iata_code;
  const station = board.station ?? firstStation;

  const params = useMemo(
    () => (station ? boardParams(station, board.direction, board.day) : undefined),
    [station, board.direction, board.day],
  );
  const enabled = Boolean(params);
  const flights = useFlights(params ?? {}, { refetchInterval: BOARD_REFRESH_MS, enabled });

  const rows = useMemo(
    () => (flights.data?.results ?? []).filter((f) => inBoardWindow(f, board.direction, board.day)),
    [flights.data, board.direction, board.day],
  );

  const stationInfo = stations.data?.results.find((a) => a.iata_code === station);
  const isToday = toDateInputValue(board.day) === toDateInputValue(new Date());
  const DirectionIcon = board.direction === 'departures' ? PlaneTakeoff : PlaneLanding;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Departures & Arrivals"
        description={
          stationInfo
            ? `${stationInfo.name} (${stationInfo.iata_code}) · ${formatLongDate(board.day)}`
            : formatLongDate(board.day)
        }
        actions={<LiveIndicator updatedAt={flights.dataUpdatedAt} fetching={flights.isFetching} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={station ?? ''} onValueChange={board.setStation} disabled={!stations.data}>
          <SelectTrigger className="w-56" aria-label="Station">
            <SelectValue placeholder="Choose a station" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {stations.data?.results.map((a) => (
              <SelectItem key={a.id} value={a.iata_code}>
                <span className="font-mono font-semibold">{a.iata_code}</span>
                <span className="text-muted-foreground"> · {a.city_name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={board.direction}
          onValueChange={(v) => board.setDirection(v as BoardDirection)}
        >
          <TabsList>
            <TabsTrigger value="departures">
              <PlaneTakeoff /> Departures
            </TabsTrigger>
            <TabsTrigger value="arrivals">
              <PlaneLanding /> Arrivals
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous day"
            onClick={() => board.setDay(addDays(board.day, -1))}
          >
            <ChevronLeft />
          </Button>
          <Input
            type="date"
            aria-label="Day"
            className="w-40"
            value={toDateInputValue(board.day)}
            onChange={(e) => {
              const d = parseDateInputValue(e.target.value);
              if (d) board.setDay(d);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Next day"
            onClick={() => board.setDay(addDays(board.day, 1))}
          >
            <ChevronRight />
          </Button>
          {!isToday && (
            <Button variant="ghost" onClick={() => board.setDay(new Date())}>
              Today
            </Button>
          )}
        </div>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {stations.isError ? (
          <ErrorState
            error={stations.error}
            title="Could not load stations"
            onRetry={() => void stations.refetch()}
          />
        ) : !enabled || flights.isPending ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : flights.isError ? (
          <ErrorState
            error={flights.error}
            title="Could not load the board"
            onRetry={() => void flights.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={DirectionIcon}
            title={`No ${board.direction} ${station ? `at ${station}` : ''}`}
            description={`Nothing is scheduled for ${formatLongDate(board.day)}.`}
          />
        ) : (
          <BoardTable rows={rows} direction={board.direction} dim={flights.isPlaceholderData} />
        )}
        {(flights.data?.count ?? 0) > BOARD_LIMIT && (
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            Showing the first {BOARD_LIMIT} of {flights.data?.count} flights for this window.
          </p>
        )}
      </Card>
    </div>
  );
}

function BoardTable({
  rows,
  direction,
  dim,
}: {
  rows: Flight[];
  direction: BoardDirection;
  dim: boolean;
}) {
  const now = Date.now();
  const nextIndex = rows.findIndex((f) => new Date(boardTime(f, direction)).getTime() >= now);
  const placeLabel = direction === 'departures' ? 'Destination' : 'Origin';

  return (
    <Table aria-label={direction === 'departures' ? 'Departures' : 'Arrivals'}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-20">Time</TableHead>
          <TableHead className="w-32">Flight</TableHead>
          <TableHead>{placeLabel}</TableHead>
          <TableHead className="hidden md:table-cell">Airline</TableHead>
          <TableHead className="hidden lg:table-cell">Aircraft</TableHead>
          <TableHead className="w-28">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={cn(dim && 'opacity-60 transition-opacity')}>
        {rows.map((f, i) => {
          const place = direction === 'departures' ? f.arrival_airport : f.departure_airport;
          const past = nextIndex === -1 || i < nextIndex;
          return (
            <TableRow
              key={f.id}
              data-next={i === nextIndex || undefined}
              className={cn(
                past && 'text-muted-foreground',
                i === nextIndex && 'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
              )}
            >
              <TableCell className="font-mono text-base font-semibold tabular-nums">
                {formatTime(boardTime(f, direction))}
              </TableCell>
              <TableCell>
                <Link
                  to={`/flights/${f.id}`}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {f.flight_number}
                </Link>
              </TableCell>
              <TableCell>
                <span className="font-medium text-foreground">{place.city}</span>{' '}
                <span className="font-mono text-xs">{place.iata_code}</span>
              </TableCell>
              <TableCell className="hidden md:table-cell">{f.airline_name.name}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {f.airplane.brand} {f.airplane.model}
              </TableCell>
              <TableCell>
                <FlightStatusBadge status={f.flight_status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function LiveIndicator({ updatedAt, fetching }: { updatedAt: number; fetching: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
      {fetching ? (
        <RotateCw className="size-3.5 animate-spin" />
      ) : (
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
      )}
      Live · refreshes every {BOARD_REFRESH_MS / 1000}s
      {updatedAt > 0 && (
        <span className="tabular-nums">
          · updated {formatTime(new Date(updatedAt).toISOString())}
        </span>
      )}
    </div>
  );
}
