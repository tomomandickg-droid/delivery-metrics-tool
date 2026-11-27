import type { Issue } from '../types';

export const NO_STATUS_LABEL = '(no status)';

export interface StatusCount {
  readonly status: string;
  readonly count: number;
}

export interface WipResult {
  readonly total: number;
  /** Largest group first; ties in alphabetical order. */
  readonly byStatus: readonly StatusCount[];
}

/**
 * Work in progress = issues with a Started date and no Resolved date, grouped by Status.
 * Backlog items (neither date) are not WIP. Not limited to the reporting window (plan.md §6.5).
 */
export function wip(issues: readonly Issue[]): WipResult {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    if (issue.started === undefined || issue.resolved !== undefined) continue;
    const status = issue.status === '' ? NO_STATUS_LABEL : issue.status;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const byStatus = [...counts]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status, 'en'));
  return { total: byStatus.reduce((sum, s) => sum + s.count, 0), byStatus };
}
