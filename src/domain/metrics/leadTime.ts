import { inclusiveDays } from '../dates';
import { durationStats } from '../stats';
import type { DurationStats, Issue, ReportingWindow } from '../types';
import { isInWindow } from '../window';

/** Lead time = Created → Resolved, inclusive calendar days, for issues resolved in the window. */
export function leadTime(issues: readonly Issue[], window: ReportingWindow): DurationStats {
  const days: number[] = [];
  for (const issue of issues) {
    if (issue.resolved !== undefined && isInWindow(window, issue.resolved)) {
      days.push(inclusiveDays(issue.created, issue.resolved));
    }
  }
  return durationStats(days);
}
