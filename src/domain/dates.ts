import type { CalendarDate } from './types';

const MS_PER_DAY = 86_400_000;

const MONTHS: Readonly<Record<string, number>> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/**
 * Builds a calendar date, or returns null if the date does not exist (e.g. 31 Feb).
 * UTC is used only for the arithmetic, so daylight saving can never shift a day.
 */
export function fromYmd(year: number, month: number, day: number): CalendarDate | null {
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return (ms / MS_PER_DAY) as CalendarDate;
}

export function toYmd(date: CalendarDate): { year: number; month: number; day: number } {
  const d = new Date(date * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Today's date in the viewer's local time zone, as a calendar date. */
export function todayLocal(now: Date): CalendarDate {
  return fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate()) as CalendarDate;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return (date + days) as CalendarDate;
}

/** ISO day of week: 1 = Monday … 7 = Sunday. 1970-01-01 was a Thursday. */
export function dayOfWeek(date: CalendarDate): number {
  return ((((date + 3) % 7) + 7) % 7) + 1;
}

/** The Monday on or before the given date. */
export function mondayOf(date: CalendarDate): CalendarDate {
  return addDays(date, -(dayOfWeek(date) - 1));
}

/**
 * Calendar days from start to end, counting both the start day and the end day.
 * Same day = 1. 1 Nov → 6 Nov = 6. (spec.md, Metrics)
 */
export function inclusiveDays(start: CalendarDate, end: CalendarDate): number {
  return end - start + 1;
}

/** "27 Nov 2026" */
export function formatDate(date: CalendarDate): string {
  const { year, month, day } = toYmd(date);
  return `${day} ${MONTH_LABELS[month - 1]} ${year}`;
}

/** "2026-11-27" */
export function formatIso(date: CalendarDate): string {
  const { year, month, day } = toYmd(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Jira default export: 27/Nov/26 10:15 AM (time optional, 12-hour clock).
const JIRA = /^(\d{1,2})\/([A-Za-z]{3})\/(\d{2})(?:\s+(\d{1,2}):(\d{2})\s*([AaPp][Mm]))?$/;
// ISO: 2026-11-27, optionally followed by T or space, a time, fractions and an offset.
const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
// Day.month.year: 27.11.2026 or 27.11.2026. (Croatian style), time optional (24-hour clock).
const DOTTED = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;

function validTime24(h?: string, m?: string, s?: string): boolean {
  if (h === undefined || m === undefined) return true;
  return Number(h) <= 23 && Number(m) <= 59 && (s === undefined || Number(s) <= 59);
}

function validTime12(h?: string, m?: string): boolean {
  if (h === undefined || m === undefined) return true;
  const hour = Number(h);
  return hour >= 1 && hour <= 12 && Number(m) <= 59;
}

/**
 * Parses a date in one of the three supported formats (plan.md §4.1).
 * The time of day is checked for sanity and then ignored; no time zone conversion is done.
 * Returns null for an empty or invalid value.
 */
export function parseDate(raw: string): CalendarDate | null {
  const value = raw.trim();

  const jira = JIRA.exec(value);
  if (jira) {
    const [, d, mon, yy, h, min] = jira;
    const month = MONTHS[(mon as string).toLowerCase()];
    if (month === undefined || !validTime12(h, min)) return null;
    return fromYmd(2000 + Number(yy), month, Number(d));
  }

  const iso = ISO.exec(value);
  if (iso) {
    const [, y, m, d, h, min, s] = iso;
    if (!validTime24(h, min, s)) return null;
    return fromYmd(Number(y), Number(m), Number(d));
  }

  const dotted = DOTTED.exec(value);
  if (dotted) {
    const [, d, m, y, h, min, s] = dotted;
    if (!validTime24(h, min, s)) return null;
    return fromYmd(Number(y), Number(m), Number(d));
  }

  return null;
}
