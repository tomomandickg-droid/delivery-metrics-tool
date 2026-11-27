import { describe, expect, it } from 'vitest';
import { REQUIRED_COLUMNS } from '../../src/domain/columns';
import { parseCsv } from '../../src/domain/parseCsv';

const HEADER = 'Issue key,Issue Type,Status,Created,Resolved,Started';

describe('parseCsv: valid files', () => {
  it('returns the required cells of each row with spreadsheet row numbers', () => {
    const csv = [
      'Summary,Issue key,Issue Type,Status,Created,Resolved,Started,Priority',
      'Login page,DM-1,Story,Done,01/Nov/26 9:00 AM,06/Nov/26 5:00 PM,02/Nov/26 10:00 AM,High',
      'Crash,DM-2,Bug,To Do,2026-11-03,,,Low',
    ].join('\n');
    expect(parseCsv(csv)).toEqual({
      ok: true,
      rows: [
        {
          rowNumber: 2,
          key: 'DM-1',
          type: 'Story',
          status: 'Done',
          created: '01/Nov/26 9:00 AM',
          resolved: '06/Nov/26 5:00 PM',
          started: '02/Nov/26 10:00 AM',
        },
        {
          rowNumber: 3,
          key: 'DM-2',
          type: 'Bug',
          status: 'To Do',
          created: '2026-11-03',
          resolved: '',
          started: '',
        },
      ],
    });
  });

  it('handles quoted fields with commas and line breaks (e.g. in Summary)', () => {
    const csv = `Summary,${HEADER}\n"Fix login, then\nlogout",DM-1,Story,Done,2026-11-01,2026-11-02,2026-11-01\n`;
    const result = parseCsv(csv);
    expect(result.ok && result.rows[0]?.key).toBe('DM-1');
  });

  it('accepts a byte-order mark, Windows line endings and blank lines', () => {
    const csv = `\uFEFF${HEADER}\r\nDM-1,Story,Done,2026-11-01,,\r\n\r\n,,,,,\r\nDM-2,Bug,Done,2026-11-02,,\r\n`;
    const result = parseCsv(csv);
    expect(result.ok && result.rows.map((r) => r.key)).toEqual(['DM-1', 'DM-2']);
  });

  it('reads short rows as empty cells and trims key, type and status', () => {
    const result = parseCsv(`${HEADER}\n DM-1 , Story , In Progress ,2026-11-01`);
    expect(result).toEqual({
      ok: true,
      rows: [
        {
          rowNumber: 2,
          key: 'DM-1',
          type: 'Story',
          status: 'In Progress',
          created: '2026-11-01',
          resolved: '',
          started: '',
        },
      ],
    });
  });

  it('uses "Custom field (Started)" and the first of repeated headers', () => {
    const csv =
      'Issue key,Sprint,Sprint,Issue Type,Status,Created,Resolved,Custom field (Started)\nDM-1,S1,S2,Task,Done,2026-11-01,2026-11-03,2026-11-02';
    const result = parseCsv(csv);
    expect(result.ok && result.rows[0]?.started).toBe('2026-11-02');
  });
});

describe('parseCsv: file errors', () => {
  it.each(['', '   \n  \n'])('reports an empty file (%j)', (text) => {
    expect(parseCsv(text)).toEqual({
      ok: false,
      error: { kind: 'empty' },
      message: 'The file is empty.',
    });
  });

  it('reports a file with only a byte-order mark as empty', () => {
    expect(parseCsv('\uFEFF')).toMatchObject({ ok: false, error: { kind: 'empty' } });
  });

  it('reports a header with no issue rows', () => {
    expect(parseCsv(`${HEADER}\n`)).toEqual({
      ok: false,
      error: { kind: 'no-data' },
      message: 'The file has a header row but no issues.',
    });
  });

  it('reports broken quoting as invalid CSV, with the row', () => {
    const result = parseCsv(`${HEADER}\nDM-1,Story,Done,2026-11-01,,\n"DM-2,Bug,Done,2026-11-02,,`);
    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-csv' } });
    expect(!result.ok && result.message).toMatch(/^The file is not valid CSV near row 3: /);
  });

  it('reports a text file that is not a Jira export as missing all columns', () => {
    const result = parseCsv('hello world\nthis is not a csv');
    expect(result).toEqual({
      ok: false,
      error: { kind: 'missing-columns', missing: [...REQUIRED_COLUMNS] },
      message:
        'Missing required columns: "Issue key", "Issue Type", "Status", "Created", "Resolved", "Started"',
    });
  });
});

describe('parseCsv: missing columns (acceptance criterion 2)', () => {
  it.each(REQUIRED_COLUMNS)('names "%s" when it is missing', (column) => {
    const header = REQUIRED_COLUMNS.filter((c) => c !== column).join(',');
    const result = parseCsv(`${header}\na,b,c,d,e`);
    expect(result).toEqual({
      ok: false,
      error: { kind: 'missing-columns', missing: [column] },
      message: `Missing required column: "${column}"`,
    });
  });

  it('names every missing column at once', () => {
    const result = parseCsv('Issue key,Issue Type,Status,Created\nDM-1,Story,Done,2026-11-01');
    expect(!result.ok && result.message).toBe('Missing required columns: "Resolved", "Started"');
  });

  it('reports missing columns before "no data" for a header-only file', () => {
    expect(parseCsv('Issue key,Status\n')).toMatchObject({
      ok: false,
      error: { kind: 'missing-columns' },
    });
  });
});
