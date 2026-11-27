import { useMemo, useState } from 'react';
import { computeDashboard } from '../domain/computeDashboard';
import { formatDate } from '../domain/dates';
import type { CalendarDate } from '../domain/types';
import { WINDOW_WEEKS } from '../domain/window';
import { DataNotes } from './DataNotes';
import { formatRange, pluralIssues } from './format';
import { LeadTimeChart } from './LeadTimeChart';
import type { LoadedData } from './loadData';
import { MetricCards } from './MetricCards';
import { ThroughputChart } from './ThroughputChart';
import { TypeFilter } from './TypeFilter';

interface DashboardViewProps {
  readonly data: LoadedData;
  readonly today: CalendarDate;
}

function shiftText(shiftDays: number): string {
  const weeks = Math.abs(shiftDays / 7);
  const unit = weeks === 1 ? 'week' : 'weeks';
  const direction = shiftDays > 0 ? 'forward' : 'back';
  return ` Sample dates are moved ${direction} ${weeks} ${unit} to fit this window.`;
}

/** Everything shown after a file is loaded. Remount (via key) for each new file. */
export function DashboardView({ data, today }: DashboardViewProps) {
  // All types are selected after upload (plan.md §7).
  const [selectedTypes, setSelectedTypes] = useState<ReadonlySet<string>>(
    () => new Set(data.types),
  );
  const typeCounts = useMemo(
    () =>
      data.types.map((type) => ({
        type,
        count: data.issues.filter((i) => i.type === type).length,
      })),
    [data.issues, data.types],
  );
  const dashboard = useMemo(
    () => computeDashboard(data.issues, selectedTypes, today),
    [data.issues, selectedTypes, today],
  );
  const noSelection = selectedTypes.size === 0;
  const { window } = dashboard;
  const nothingInWindow =
    !noSelection && dashboard.issueCount > 0 && dashboard.throughput.total === 0;

  return (
    <>
      <div className="toolbar">
        <p className="source">
          <strong>{data.fileName}</strong>: {pluralIssues(data.issues.length)}. Reporting window:{' '}
          {WINDOW_WEEKS} weeks, {formatRange(window.start, window.end)} (the current week is not
          finished, so it is left out).
          {data.isSample && data.shiftDays !== 0 && shiftText(data.shiftDays)}
        </p>
        <TypeFilter types={typeCounts} selected={selectedTypes} onChange={setSelectedTypes} />
      </div>

      <DataNotes skipped={data.skipped} startedBeforeCreated={data.startedBeforeCreated} />

      {noSelection && (
        <div className="message message-info" role="status">
          <p>Select at least one issue type to see the metrics.</p>
        </div>
      )}

      {nothingInWindow && (
        <div className="message message-info" role="status">
          <p>
            No issues resolved between {formatDate(window.start)} and {formatDate(window.end)}.{' '}
            {dashboard.latestResolved === null
              ? 'No issue in this file has a Resolved date.'
              : `The latest Resolved date in this file is ${formatDate(dashboard.latestResolved)}.`}
          </p>
        </div>
      )}

      <MetricCards dashboard={dashboard} noSelection={noSelection} />

      <div className="charts">
        <ThroughputChart throughput={dashboard.throughput} noData={noSelection} />
        <LeadTimeChart leadTime={dashboard.leadTime} noData={noSelection} />
      </div>
    </>
  );
}
