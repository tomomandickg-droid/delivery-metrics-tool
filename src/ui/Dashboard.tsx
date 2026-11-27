import { useMemo, useState } from 'react';
import { computeDashboard } from '../domain/computeDashboard';
import { formatDate } from '../domain/dates';
import type { CalendarDate } from '../domain/types';
import { WINDOW_WEEKS } from '../domain/window';
import { DataNotes } from './DataNotes';
import { formatRange, pluralIssues } from './format';
import type { LoadedData } from './loadData';
import { MetricCards } from './MetricCards';

interface DashboardViewProps {
  readonly data: LoadedData;
  readonly today: CalendarDate;
}

/** Everything shown after a file is loaded. Remount (via key) for each new file. */
export function DashboardView({ data, today }: DashboardViewProps) {
  const [selectedTypes] = useState<ReadonlySet<string>>(() => new Set(data.types));
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
          {data.isSample && data.shiftDays !== 0 && (
            <> Sample dates are moved forward {data.shiftDays / 7} weeks to fit this window.</>
          )}
        </p>
      </div>

      <DataNotes skipped={data.skipped} startedBeforeCreated={data.startedBeforeCreated} />

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
    </>
  );
}
