import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { binIndexOf, binLabel, histogram, type HistogramBin } from '../domain/histogram';
import type { DurationStats } from '../domain/types';
import { formatDays } from './format';

interface LeadTimeChartProps {
  readonly leadTime: DurationStats;
  readonly noData: boolean;
}

/** Histogram of lead times with marker lines at the median and 85th percentile (§6.6). */
export function LeadTimeChart({ leadTime, noData }: LeadTimeChartProps) {
  const h = histogram(leadTime.values);
  const data = h.bins.map((bin) => ({ days: binLabel(bin), count: bin.count }));
  const { median, p85 } = leadTime;
  const empty = noData || median === null || p85 === null;
  const grouping = h.binWidth === 1 ? 'one bar per day' : `grouped by ${h.binWidth} days`;
  // Only called when there is data, so there is at least one bin.
  const markerAt = (value: number) => binLabel(h.bins[binIndexOf(h, value)] as HistogramBin);

  return (
    <figure className="panel chart" aria-labelledby="lead-time-chart-title">
      <figcaption id="lead-time-chart-title">
        Lead time distribution
        <span>Issues resolved in the window, by lead time in days ({grouping})</span>
      </figcaption>
      {empty ? (
        <p className="empty-state">No data</p>
      ) : (
        <>
          <div className="chart-body" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="days" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-muted)' }}
                  formatter={(value) => [value, 'Issues']}
                  labelFormatter={(label) => `${String(label)} days`}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-bar)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
                <ReferenceLine
                  x={markerAt(median)}
                  stroke="var(--chart-median)"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                />
                <ReferenceLine
                  x={markerAt(p85)}
                  stroke="var(--chart-p85)"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="legend">
            <span className="median">Median {formatDays(median)}</span>
            <span className="p85">85th percentile {formatDays(p85)}</span>
          </p>
          <table className="visually-hidden">
            <caption>Issues by lead time</caption>
            <thead>
              <tr>
                <th scope="col">Lead time (days)</th>
                <th scope="col">Issues</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.days}>
                  <td>{row.days}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
