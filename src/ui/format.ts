import { formatDate, toYmd } from '../domain/dates';
import { round1 } from '../domain/stats';
import type { CalendarDate } from '../domain/types';

/** One decimal at most, without a trailing ".0": 6.4, 5, 12.6. */
export function formatNumber(value: number): string {
  return round1(value).toLocaleString('en', { maximumFractionDigits: 1 });
}

/** "1 day", "6.5 days" */
export function formatDays(value: number): string {
  const text = formatNumber(value);
  return `${text} ${text === '1' ? 'day' : 'days'}`;
}

/** "1 issue", "7 issues" */
export function pluralIssues(count: number): string {
  return count === 1 ? '1 issue' : `${count} issues`;
}

/** "31 Aug – 22 Nov 2026", or "28 Dec 2026 – 3 Jan 2027" across a year boundary. */
export function formatRange(start: CalendarDate, end: CalendarDate): string {
  const full = formatDate(start);
  if (toYmd(start).year !== toYmd(end).year) return `${full} – ${formatDate(end)}`;
  return `${full.replace(/ \d{4}$/, '')} – ${formatDate(end)}`;
}

/** Week label for charts: "31 Aug" */
export function formatWeekLabel(monday: CalendarDate): string {
  return formatDate(monday).replace(/ \d{4}$/, '');
}
