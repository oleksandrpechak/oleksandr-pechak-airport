import { Fragment, useMemo } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SeatMapSeat } from '@/lib/api/schema';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

import { cabinLabel, seatState, type SeatState } from './seats';

const STATE_LABEL: Record<SeatState, string> = {
  available: 'Available',
  taken: 'Taken',
  blocked: 'Unavailable',
};

const seatClass: Record<SeatState, string> = {
  available: 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20',
  taken: 'border-transparent bg-muted-foreground/25 text-muted-foreground',
  blocked:
    'border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground/60 line-through',
};

/**
 * Read-only cabin layout. Rows run top (nose) to bottom; the aisle sits in the
 * middle of each row. Seat letters come from the data, so any layout works.
 */
export function SeatMap({ seats }: { seats: SeatMapSeat[] }) {
  const { rows, letters } = useMemo(() => {
    const letterSet = new Set<string>();
    const byRow = new Map<number, Map<string, SeatMapSeat>>();
    for (const s of seats) {
      letterSet.add(s.seat);
      const row = byRow.get(s.row) ?? new Map<string, SeatMapSeat>();
      row.set(s.seat, s);
      byRow.set(s.row, row);
    }
    return {
      rows: [...byRow.entries()].sort(([a], [b]) => a - b),
      letters: [...letterSet].sort(),
    };
  }, [seats]);

  const aisleAfter = Math.ceil(letters.length / 2) - 1;
  const columns = `2rem repeat(${aisleAfter + 1}, 2rem) 1.25rem repeat(${letters.length - aisleAfter - 1}, 2rem) 2rem`;

  let previousCabin: string | undefined;

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
        {(['available', 'taken', 'blocked'] as const).map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <span className={cn('inline-block size-3.5 rounded-sm border', seatClass[state])} />
            {STATE_LABEL[state]}
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <div
          role="grid"
          aria-label="Seat map"
          className="mx-auto grid w-fit gap-1.5 rounded-t-[3rem] border bg-background/60 px-4 pt-10 pb-4"
          style={{ gridTemplateColumns: columns }}
        >
          <div role="row" className="contents">
            <span />
            {letters.map((l, i) => (
              <Fragment key={l}>
                <span
                  role="columnheader"
                  className="text-center text-[11px] font-medium text-muted-foreground"
                >
                  {l}
                </span>
                {i === aisleAfter && <span />}
              </Fragment>
            ))}
            <span />
          </div>

          {rows.map(([rowNumber, rowSeats]) => {
            const cabin = rowSeats.values().next().value?.class_type;
            const cabinBreak = cabin !== previousCabin;
            previousCabin = cabin;
            return (
              <Fragment key={rowNumber}>
                {cabinBreak && cabin && (
                  <div
                    className="col-span-full mt-1 border-t pt-1 text-center text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                    role="presentation"
                  >
                    {cabinLabel(cabin)}
                  </div>
                )}
                <div role="row" className="contents">
                  <span
                    role="rowheader"
                    className="self-center text-right text-[11px] text-muted-foreground tabular-nums"
                  >
                    {rowNumber}
                  </span>
                  {letters.map((letter, i) => {
                    const seat = rowSeats.get(letter);
                    return (
                      <Fragment key={letter}>
                        {seat ? <Seat seat={seat} /> : <span role="gridcell" />}
                        {i === aisleAfter && <span aria-hidden />}
                      </Fragment>
                    );
                  })}
                  <span
                    aria-hidden
                    className="self-center text-[11px] text-muted-foreground tabular-nums"
                  >
                    {rowNumber}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Seat({ seat }: { seat: SeatMapSeat }) {
  const state = seatState(seat.ticket_status);
  const label = `${seat.row}${seat.seat}, ${cabinLabel(seat.class_type)}, ${STATE_LABEL[state].toLowerCase()}, ${formatMoney(seat.price)}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="gridcell"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            'grid h-7 place-items-center rounded-md border text-[11px] font-medium transition-colors',
            seat.class_type === 'BUSINESS' && 'h-8',
            seatClass[state],
          )}
        >
          {seat.seat}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-mono font-semibold">
          {seat.row}
          {seat.seat}
        </span>{' '}
        · {cabinLabel(seat.class_type)} · {formatMoney(seat.price)} · {STATE_LABEL[state]}
      </TooltipContent>
    </Tooltip>
  );
}
