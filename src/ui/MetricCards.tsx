import type { Dashboard } from '../domain/computeDashboard';
import type { DurationStats } from '../domain/types';
import { WINDOW_WEEKS } from '../domain/window';
import { formatDays, formatNumber, pluralIssues } from './format';
import { MetricCard } from './MetricCard';

interface MetricCardsProps {
  readonly dashboard: Dashboard;
  /** True when no Issue Type is selected: every card shows "No data". */
  readonly noSelection: boolean;
}

function durationValue(stats: DurationStats): string | null {
  return stats.median === null ? null : formatNumber(stats.median);
}

function durationRows(stats: DurationStats) {
  return [
    { label: '85th percentile', value: stats.p85 === null ? '–' : formatDays(stats.p85) },
    { label: 'Issues', value: String(stats.n) },
  ];
}

/** The four metric cards (spec: Dashboard). */
export function MetricCards({ dashboard, noSelection }: MetricCardsProps) {
  const { throughput, leadTime, cycleTime, wip } = dashboard;
  const unitFor = (median: number | null) => (median === 1 ? 'day' : 'days');

  return (
    <div className="cards">
      <MetricCard
        title="Throughput"
        value={noSelection ? null : formatNumber(throughput.averagePerWeek)}
        unit="per week"
        caption={`average over ${WINDOW_WEEKS} completed weeks`}
        rows={[{ label: 'Resolved', value: pluralIssues(throughput.total) }]}
      />
      <MetricCard
        title="Lead time"
        value={noSelection ? null : durationValue(leadTime)}
        unit={unitFor(leadTime.median)}
        caption="median, Created → Resolved"
        rows={durationRows(leadTime)}
      />
      <MetricCard
        title="Cycle time"
        value={noSelection ? null : durationValue(cycleTime)}
        unit={unitFor(cycleTime.median)}
        caption="median, Started → Resolved"
        rows={durationRows(cycleTime)}
        {...(!noSelection &&
          cycleTime.withoutStarted > 0 && {
            note: `${pluralIssues(cycleTime.withoutStarted)} resolved without a Started date ${
              cycleTime.withoutStarted === 1 ? 'is' : 'are'
            } not included.`,
          })}
      />
      <MetricCard
        title="Work in progress"
        value={noSelection ? null : String(wip.total)}
        unit={wip.total === 1 ? 'issue' : 'issues'}
        caption="started, not yet resolved"
        rows={wip.byStatus.map((s) => ({ label: s.status, value: String(s.count) }))}
      />
    </div>
  );
}
