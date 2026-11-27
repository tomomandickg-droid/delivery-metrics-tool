import { parseDate } from './dates';
import type { RawRow } from './parseCsv';
import type { CalendarDate, Issue, SkippedRow, SkipReason } from './types';

export interface IssuesResult {
  readonly issues: readonly Issue[];
  readonly skipped: readonly SkippedRow[];
}

type OptionalDate = { ok: true; date?: CalendarDate } | { ok: false };

/** An empty cell is fine (open / not started); a non-empty cell must be a valid date. */
function optionalDate(raw: string): OptionalDate {
  if (raw.trim() === '') return { ok: true };
  const date = parseDate(raw);
  return date === null ? { ok: false } : { ok: true, date };
}

/**
 * Converts raw rows to issues. A row is skipped, with a reason, when a date is invalid,
 * the dates are in an impossible order, or the issue key repeats an earlier kept issue
 * (plan.md §4.3). Started before Created is allowed.
 */
export function toIssues(rows: readonly RawRow[]): IssuesResult {
  const issues: Issue[] = [];
  const skipped: SkippedRow[] = [];
  const keptKeys = new Set<string>();

  const skip = (row: RawRow, reason: SkipReason) => {
    skipped.push({ rowNumber: row.rowNumber, key: row.key, reason });
  };

  for (const row of rows) {
    const created = parseDate(row.created);
    if (created === null) {
      skip(row, 'invalid-created');
      continue;
    }
    const resolved = optionalDate(row.resolved);
    if (!resolved.ok) {
      skip(row, 'invalid-resolved');
      continue;
    }
    const started = optionalDate(row.started);
    if (!started.ok) {
      skip(row, 'invalid-started');
      continue;
    }
    if (resolved.date !== undefined && resolved.date < created) {
      skip(row, 'resolved-before-created');
      continue;
    }
    if (resolved.date !== undefined && started.date !== undefined && started.date > resolved.date) {
      skip(row, 'started-after-resolved');
      continue;
    }
    if (row.key !== '' && keptKeys.has(row.key)) {
      skip(row, 'duplicate-key');
      continue;
    }

    if (row.key !== '') keptKeys.add(row.key);
    issues.push({
      key: row.key,
      type: row.type,
      status: row.status,
      created,
      ...(resolved.date !== undefined && { resolved: resolved.date }),
      ...(started.date !== undefined && { started: started.date }),
    });
  }

  return { issues, skipped };
}

const REASON_TEXT: Readonly<Record<SkipReason, string>> = {
  'invalid-created': 'Created is empty or not a valid date',
  'invalid-resolved': 'Resolved is not a valid date',
  'invalid-started': 'Started is not a valid date',
  'resolved-before-created': 'Resolved is earlier than Created',
  'started-after-resolved': 'Started is later than Resolved',
  'duplicate-key': 'Duplicate issue key; the first row was kept',
};

export function skipReasonText(reason: SkipReason): string {
  return REASON_TEXT[reason];
}

/** The issue key, or "row 17" when the key cell is empty. */
export function skippedRowLabel(row: SkippedRow): string {
  return row.key === '' ? `row ${row.rowNumber}` : row.key;
}
