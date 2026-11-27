/**
 * A calendar date (year, month, day) with no time of day and no time zone,
 * stored as whole days since 1970-01-01. The brand stops plain numbers
 * (like a duration in days) being passed where a date is expected.
 */
export type CalendarDate = number & { readonly __brand: 'CalendarDate' };

/** One issue after parsing. Optional dates are absent when the CSV cell was empty. */
export interface Issue {
  readonly key: string;
  readonly type: string;
  readonly status: string;
  readonly created: CalendarDate;
  readonly resolved?: CalendarDate;
  readonly started?: CalendarDate;
}

/** Why a CSV row was left out of every metric (plan.md §4.3). */
export type SkipReason =
  | 'invalid-created'
  | 'invalid-resolved'
  | 'invalid-started'
  | 'resolved-before-created'
  | 'started-after-resolved'
  | 'duplicate-key';

export interface SkippedRow {
  /** Row number as a spreadsheet shows it: the header is row 1, the first issue row 2. */
  readonly rowNumber: number;
  /** Issue key as written; may be empty. */
  readonly key: string;
  readonly reason: SkipReason;
}

/** The 12 completed Monday–Sunday weeks before the current week (plan.md §5). */
export interface ReportingWindow {
  /** Monday of the first week. */
  readonly start: CalendarDate;
  /** Sunday of the last completed week. */
  readonly end: CalendarDate;
  /** Monday of each of the 12 weeks, oldest first. */
  readonly weekStarts: readonly CalendarDate[];
}

/** Median and 85th percentile of a set of durations, in days. */
export interface DurationStats {
  readonly n: number;
  /** One value per included issue, sorted ascending. */
  readonly values: readonly number[];
  /** null when n = 0. */
  readonly median: number | null;
  /** null when n = 0. */
  readonly p85: number | null;
}
