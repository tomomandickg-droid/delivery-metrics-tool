import { inclusiveDays } from '../dates';
import { durationStats } from '../stats';
import type { DurationStats, Issue, ReportingWindow } from '../types';
import { isInWindow } from '../window';

export interface CycleTimeResult extends DurationStats {
  /** Issues resolved in the window that have no Started date (left out of cycle time). */
  readonly withoutStarted: number;
}

/**
 * Cycle time = Started → Resolved, inclusive calendar days, for issues resolved in the window.
 * If Started is before Created, cycle time counts from Created, so it equals lead time
 * (owner decision, 27 Nov 2026). Such issues are listed by toIssues().
 */
export function cycleTime(issues: readonly Issue[], window: ReportingWindow): CycleTimeResult {
  const days: number[] = [];
  let withoutStarted = 0;
  for (const issue of issues) {
    if (issue.resolved === undefined || !isInWindow(window, issue.resolved)) continue;
    if (issue.started === undefined) {
      withoutStarted++;
      continue;
    }
    const start = issue.started < issue.created ? issue.created : issue.started;
    days.push(inclusiveDays(start, issue.resolved));
  }
  return { ...durationStats(days), withoutStarted };
}
