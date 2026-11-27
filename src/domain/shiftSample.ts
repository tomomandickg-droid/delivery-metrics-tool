import { addDays, fromYmd, mondayOf } from './dates';
import type { CalendarDate, Issue } from './types';

/** The export date the sample file was generated for: Friday 27 Nov 2026. */
export const SAMPLE_EXPORT_DATE = fromYmd(2026, 11, 27) as CalendarDate;

/**
 * Days to move the sample so that its export week becomes the current week (plan.md §8.2).
 * Always a whole number of weeks, so every date keeps its weekday and every duration
 * and weekly count stays the same. Negative if today is before the export week.
 */
export function sampleShiftDays(today: CalendarDate, exportDate = SAMPLE_EXPORT_DATE): number {
  return mondayOf(today) - mondayOf(exportDate);
}

/** Moves every date of every issue by `days`, which must be a whole number of weeks. */
export function shiftIssues(issues: readonly Issue[], days: number): Issue[] {
  if (!Number.isInteger(days) || days % 7 !== 0) {
    throw new RangeError(`Sample shift must be a whole number of weeks, got ${days} days`);
  }
  return issues.map((issue) => ({
    ...issue,
    created: addDays(issue.created, days),
    ...(issue.started !== undefined && { started: addDays(issue.started, days) }),
    ...(issue.resolved !== undefined && { resolved: addDays(issue.resolved, days) }),
  }));
}
