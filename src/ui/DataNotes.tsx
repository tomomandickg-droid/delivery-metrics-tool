import { skippedRowLabel, skipReasonText, startedBeforeCreatedText } from '../domain/toIssues';
import type { AdjustedIssue, SkippedRow } from '../domain/types';

interface DataNotesProps {
  readonly skipped: readonly SkippedRow[];
  readonly startedBeforeCreated: readonly AdjustedIssue[];
}

/** Lists open by default while they are short, so the keys are visible at a glance. */
const OPEN_UP_TO = 10;

/**
 * Skipped rows (count, keys, reasons) and issues whose cycle time was adjusted because
 * Started is before Created. Both cover the whole file, independent of the filter.
 */
export function DataNotes({ skipped, startedBeforeCreated }: DataNotesProps) {
  const adjustedText = startedBeforeCreatedText(startedBeforeCreated);
  if (skipped.length === 0 && adjustedText === null) return null;

  return (
    <section className="notes" aria-label="Data notes">
      {skipped.length > 0 && (
        <details open={skipped.length <= OPEN_UP_TO}>
          <summary>
            {skipped.length === 1 ? '1 row skipped' : `${skipped.length} rows skipped`}:{' '}
            {skipped.map(skippedRowLabel).join(', ')}
          </summary>
          <ul>
            {skipped.map((row) => (
              <li key={row.rowNumber}>
                <code>{skippedRowLabel(row)}</code> (row {row.rowNumber}):{' '}
                {skipReasonText(row.reason)}
              </li>
            ))}
          </ul>
        </details>
      )}
      {adjustedText !== null && (
        <details open={startedBeforeCreated.length <= OPEN_UP_TO}>
          <summary>{adjustedText}</summary>
          <ul>
            <li>
              Started is earlier than Created, so cycle time is counted from Created and equals the
              lead time for these issues.
            </li>
          </ul>
        </details>
      )}
    </section>
  );
}
