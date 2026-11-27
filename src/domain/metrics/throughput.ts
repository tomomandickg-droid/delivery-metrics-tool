import type { CalendarDate, Issue, ReportingWindow } from '../types';
import { weekIndex, WINDOW_WEEKS } from '../window';

export interface WeekCount {
  /** Monday of the week. */
  readonly weekStart: CalendarDate;
  readonly count: number;
}

export interface ThroughputResult {
  /** 12 weeks, oldest first; weeks with nothing resolved have count 0. */
  readonly weeks: readonly WeekCount[];
  /** Issues resolved in the window. */
  readonly total: number;
  /** total ÷ 12, full precision; weeks with 0 are part of the average (plan.md §6.1). */
  readonly averagePerWeek: number;
}

/** Issues resolved per Monday–Sunday week of the reporting window. */
export function throughput(issues: readonly Issue[], window: ReportingWindow): ThroughputResult {
  const counts = new Array<number>(WINDOW_WEEKS).fill(0);
  for (const issue of issues) {
    if (issue.resolved === undefined) continue;
    const index = weekIndex(window, issue.resolved);
    if (index >= 0) counts[index] = (counts[index] as number) + 1;
  }
  const total = counts.reduce((sum, c) => sum + c, 0);
  return {
    weeks: window.weekStarts.map((weekStart, i) => ({ weekStart, count: counts[i] as number })),
    total,
    averagePerWeek: total / WINDOW_WEEKS,
  };
}
