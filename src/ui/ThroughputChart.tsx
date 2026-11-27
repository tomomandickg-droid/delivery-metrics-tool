import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ThroughputResult } from '../domain/metrics/throughput';
import { formatWeekLabel } from './format';

interface ThroughputChartProps {
  readonly throughput: ThroughputResult;
  readonly noData: boolean;
}

/** 12 bars, one per completed Monday–Sunday week, oldest first (plan.md §6.1). */
export function ThroughputChart({ throughput, noData }: ThroughputChartProps) {
  const data = throughput.weeks.map((w) => ({
    week: formatWeekLabel(w.weekStart),
    count: w.count,
  }));

  return (
    <figure className="panel chart" aria-labelledby="throughput-chart-title">
      <figcaption id="throughput-chart-title">
        Throughput per week
        <span>Issues resolved in each of the last 12 completed weeks (week starting Monday)</span>
      </figcaption>
      {noData ? (
        <p className="empty-state">No data</p>
      ) : (
        <>
          <div className="chart-body" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                  interval={1}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-muted)' }}
                  formatter={(value) => [value, 'Resolved']}
                  labelFormatter={(label) => `Week of ${String(label)}`}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-bar)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="visually-hidden">
            <caption>Issues resolved per week</caption>
            <thead>
              <tr>
                <th scope="col">Week starting</th>
                <th scope="col">Resolved</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.week}>
                  <td>{row.week}</td>
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
