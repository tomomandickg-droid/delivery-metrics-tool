import { useId, type ReactNode } from 'react';

export interface MetricRow {
  readonly label: string;
  readonly value: string;
}

interface MetricCardProps {
  readonly title: string;
  /** Main number; null shows "No data". */
  readonly value: string | null;
  readonly unit?: string;
  /** Small caption under the number, e.g. "median". */
  readonly caption?: string;
  readonly rows?: readonly MetricRow[];
  readonly note?: ReactNode;
}

export function MetricCard({ title, value, unit, caption, rows = [], note }: MetricCardProps) {
  const id = useId();
  return (
    <section className="panel card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {value === null ? (
        <p className="value no-data">No data</p>
      ) : (
        <p className="value">
          {value}
          {unit !== undefined && <span className="unit">{unit}</span>}
        </p>
      )}
      {value !== null && caption !== undefined && <p className="note">{caption}</p>}
      {value !== null && rows.length > 0 && (
        <dl>
          {rows.map((row) => (
            <div key={row.label} style={{ display: 'contents' }}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {note !== undefined && <p className="note">{note}</p>}
    </section>
  );
}
