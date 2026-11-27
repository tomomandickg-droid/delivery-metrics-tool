import Papa from 'papaparse';
import { matchColumns, missingColumnsMessage, type RequiredColumn } from './columns';

/** The required cells of one data row, as raw strings. */
export interface RawRow {
  /** Spreadsheet row number: the header is row 1, the first data row is row 2. */
  readonly rowNumber: number;
  readonly key: string;
  readonly type: string;
  readonly status: string;
  readonly created: string;
  readonly resolved: string;
  readonly started: string;
}

export type CsvError =
  | { readonly kind: 'empty' }
  | { readonly kind: 'no-data' }
  | { readonly kind: 'invalid-csv'; readonly detail: string }
  | { readonly kind: 'missing-columns'; readonly missing: readonly RequiredColumn[] };

export type CsvParseResult =
  | { readonly ok: true; readonly rows: readonly RawRow[] }
  | { readonly ok: false; readonly error: CsvError; readonly message: string };

function fail(error: CsvError, message: string): CsvParseResult {
  return { ok: false, error, message };
}

/**
 * Reads a Jira CSV export and returns the required cells of every row (plan.md §4.2).
 * Papa Parse runs without header mode, because Jira repeats some headers (e.g. Sprint).
 */
export function parseCsv(text: string): CsvParseResult {
  const content = text.replace(/^\uFEFF/, '');
  if (content.trim() === '') {
    return fail({ kind: 'empty' }, 'The file is empty.');
  }

  const parsed = Papa.parse<string[]>(content, { header: false, skipEmptyLines: 'greedy' });
  // "Quotes" errors mean the file is not valid CSV. A one-column file only gets an
  // "undetectable delimiter" warning; it is reported below as missing columns instead.
  const quoteError = parsed.errors.find((e) => e.type === 'Quotes');
  if (quoteError) {
    // Papa counts rows from 0 including the header line, so spreadsheet row = row + 1.
    const row = quoteError.row === undefined ? '' : ` near row ${quoteError.row + 1}`;
    return fail(
      { kind: 'invalid-csv', detail: quoteError.message },
      `The file is not valid CSV${row}: ${quoteError.message}.`,
    );
  }

  const [headers, ...dataRows] = parsed.data as [string[], ...string[][]];
  const columns = matchColumns(headers);
  if (!columns.ok) {
    return fail(
      { kind: 'missing-columns', missing: columns.missing },
      missingColumnsMessage(columns.missing),
    );
  }

  if (dataRows.length === 0) {
    return fail({ kind: 'no-data' }, 'The file has a header row but no issues.');
  }

  const i = columns.indexes;
  const cell = (row: readonly string[], index: number) => row[index] ?? '';
  const rows = dataRows.map((row, n): RawRow => ({
    rowNumber: n + 2,
    key: cell(row, i['Issue key']).trim(),
    type: cell(row, i['Issue Type']).trim(),
    status: cell(row, i.Status).trim(),
    created: cell(row, i.Created),
    resolved: cell(row, i.Resolved),
    started: cell(row, i.Started),
  }));
  return { ok: true, rows };
}
