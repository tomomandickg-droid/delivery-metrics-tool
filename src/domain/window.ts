import { addDays, mondayOf } from './dates';
import type { CalendarDate, ReportingWindow } from './types';

export const WINDOW_WEEKS = 12;

/**
 * The 12 completed Monday–Sunday weeks before the week that contains `today`.
 * The current week is not finished yet, so it is excluded (plan.md §5).
 *
 * today = Fri 27 Nov 2026 → Mon 31 Aug 2026 … Sun 22 Nov 2026.
 */
export function reportingWindow(today: CalendarDate): ReportingWindow {
  const currentMonday = mondayOf(today);
  const start = addDays(currentMonday, -7 * WINDOW_WEEKS);
  const end = addDays(currentMonday, -1);
  const weekStarts = Array.from({ length: WINDOW_WEEKS }, (_, i) => addDays(start, 7 * i));
  return { start, end, weekStarts };
}

export function isInWindow(window: ReportingWindow, date: CalendarDate): boolean {
  return date >= window.start && date <= window.end;
}

/** 0-based week index within the window, or -1 if the date is outside it. */
export function weekIndex(window: ReportingWindow, date: CalendarDate): number {
  return isInWindow(window, date) ? Math.floor((date - window.start) / 7) : -1;
}
