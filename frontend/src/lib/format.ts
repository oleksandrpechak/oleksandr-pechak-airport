/**
 * Display formatting. Times come from the API in UTC (Django `USE_TZ = True`)
 * and are shown in the viewer's local time zone.
 */

/** Backend `DEFAULT_CURRENCY`. Prices carry no currency field of their own. */
export const CURRENCY = 'USD';

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' });
const longDateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const moneyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY });

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatShortDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatLongDate = (date: Date) => longDateFmt.format(date);

/** DRF decimals arrive as strings ("120.00"); some schema fields claim number. */
export const formatMoney = (value: string | number) => moneyFmt.format(Number(value));

/** "2h 05m" between two ISO timestamps. */
export function formatDuration(fromIso: string, toIso: string): string {
  const minutes = Math.max(
    Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60_000),
    0,
  );
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** Calendar day boundaries in local time, as `yyyy-mm-dd` ↔ Date. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateInputValue(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
