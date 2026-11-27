import { filterByTypes } from './filter';
import { cycleTime, type CycleTimeResult } from './metrics/cycleTime';
import { leadTime } from './metrics/leadTime';
import { throughput, type ThroughputResult } from './metrics/throughput';
import { wip, type WipResult } from './metrics/wip';
import type { CalendarDate, DurationStats, Issue, ReportingWindow } from './types';
import { reportingWindow } from './window';

export interface Dashboard {
  readonly window: ReportingWindow;
  /** Issues left after the Issue Type filter. */
  readonly issueCount: number;
  readonly throughput: ThroughputResult;
  readonly leadTime: DurationStats;
  readonly cycleTime: CycleTimeResult;
  readonly wip: WipResult;
  /**
   * Latest Resolved date in the whole file (not filtered), or null if nothing is resolved.
   * Used to explain an empty window, e.g. after uploading an old export (plan.md §5).
   */
  readonly latestResolved: CalendarDate | null;
}

/** Everything the dashboard shows, for the selected Issue Types and today's date. */
export function computeDashboard(
  issues: readonly Issue[],
  selectedTypes: ReadonlySet<string>,
  today: CalendarDate,
): Dashboard {
  const window = reportingWindow(today);
  const filtered = filterByTypes(issues, selectedTypes);

  let latestResolved: CalendarDate | null = null;
  for (const issue of issues) {
    if (issue.resolved !== undefined && (latestResolved === null || issue.resolved > latestResolved)) {
      latestResolved = issue.resolved;
    }
  }

  return {
    window,
    issueCount: filtered.length,
    throughput: throughput(filtered, window),
    leadTime: leadTime(filtered, window),
    cycleTime: cycleTime(filtered, window),
    wip: wip(filtered),
    latestResolved,
  };
}
