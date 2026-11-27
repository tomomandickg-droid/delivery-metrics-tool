import { describe, expect, it } from 'vitest';
import type { RawRow } from '../../src/domain/parseCsv';
import {
  skippedRowLabel,
  skipReasonText,
  startedBeforeCreatedText,
  toIssues,
} from '../../src/domain/toIssues';
import type { SkipReason } from '../../src/domain/types';
import { d } from './helpers';

let nextRow = 2;
function row(fields: Partial<RawRow>): RawRow {
  return {
    rowNumber: nextRow++,
    key: 'DM-1',
    type: 'Story',
    status: 'Done',
    created: '2026-11-01',
    resolved: '',
    started: '',
    ...fields,
  };
}

describe('toIssues: kept rows', () => {
  it('keeps a resolved issue with all three dates', () => {
    const result = toIssues([
      row({
        key: 'DM-1',
        created: '01/Nov/26 9:00 AM',
        started: '2.11.2026.',
        resolved: '2026-11-06',
      }),
    ]);
    expect(result.skipped).toEqual([]);
    expect(result.issues).toEqual([
      {
        key: 'DM-1',
        type: 'Story',
        status: 'Done',
        created: d('2026-11-01'),
        started: d('2026-11-02'),
        resolved: d('2026-11-06'),
      },
    ]);
  });

  it('keeps an open issue with empty Resolved and Started (no warning)', () => {
    const result = toIssues([row({ status: 'To Do', resolved: '', started: '  ' })]);
    expect(result.skipped).toEqual([]);
    expect(result.issues[0]).toEqual({
      key: 'DM-1',
      type: 'Story',
      status: 'To Do',
      created: d('2026-11-01'),
    });
    expect(result.issues[0]).not.toHaveProperty('resolved');
    expect(result.issues[0]).not.toHaveProperty('started');
  });

  it('keeps a resolved issue without Started (excluded later from cycle time only)', () => {
    const result = toIssues([row({ resolved: '2026-11-03' })]);
    expect(result.skipped).toEqual([]);
    expect(result.issues[0]).not.toHaveProperty('started');
  });

  it('keeps Started earlier than Created and lists it as adjusted (not skipped)', () => {
    const r = row({
      key: 'DM-7',
      created: '2026-11-05',
      started: '2026-11-01',
      resolved: '2026-11-06',
    });
    const result = toIssues([r]);
    expect(result.skipped).toEqual([]);
    expect(result.issues).toHaveLength(1);
    // The raw Started date is kept; cycle time adjusts it (see leadCycleTime.test.ts).
    expect(result.issues[0]?.started).toBe(d('2026-11-01'));
    expect(result.startedBeforeCreated).toEqual([{ rowNumber: r.rowNumber, key: 'DM-7' }]);
  });

  it('also lists an open issue whose Started is before Created', () => {
    const r = row({ key: 'DM-8', created: '2026-11-05', started: '2026-11-04' });
    expect(toIssues([r]).startedBeforeCreated).toEqual([{ rowNumber: r.rowNumber, key: 'DM-8' }]);
  });

  it('does not list Started on the same day as Created, or later', () => {
    const result = toIssues([
      row({ key: 'A', created: '2026-11-05', started: '2026-11-05' }),
      row({ key: 'B', created: '2026-11-05', started: '2026-11-06' }),
      row({ key: 'C', created: '2026-11-05' }),
    ]);
    expect(result.startedBeforeCreated).toEqual([]);
  });

  it('does not list a skipped row, even if its Started is before Created', () => {
    const first = row({ key: 'DM-1' });
    const dup = row({ key: 'DM-1', created: '2026-11-05', started: '2026-11-01' });
    expect(toIssues([first, dup]).startedBeforeCreated).toEqual([]);
  });

  it('keeps same-day Created, Started and Resolved', () => {
    const result = toIssues([
      row({ created: '2026-11-05', started: '2026-11-05', resolved: '2026-11-05' }),
    ]);
    expect(result.issues).toHaveLength(1);
  });

  it('keeps an open issue whose Started is later than Created (no Resolved to compare)', () => {
    const result = toIssues([row({ created: '2026-11-01', started: '2026-11-20' })]);
    expect(result.issues).toHaveLength(1);
  });

  it('keeps rows with an empty key and does not treat two empty keys as duplicates', () => {
    const result = toIssues([row({ key: '' }), row({ key: '' })]);
    expect(result.issues).toHaveLength(2);
    expect(result.skipped).toEqual([]);
  });
});

describe('toIssues: skipped rows (plan.md §4.3)', () => {
  it.each<[string, Partial<RawRow>, SkipReason]>([
    ['Created empty', { created: '' }, 'invalid-created'],
    ['Created not a date', { created: 'soon' }, 'invalid-created'],
    ['Created does not exist', { created: '31.02.2026' }, 'invalid-created'],
    ['Resolved not a date', { resolved: '31.02.2026' }, 'invalid-resolved'],
    ['Started not a date', { resolved: '2026-11-06', started: '2026-13-01' }, 'invalid-started'],
    ['Started not a date on an open issue', { started: 'tbd' }, 'invalid-started'],
    [
      'Resolved before Created',
      { created: '2026-11-05', resolved: '2026-11-04' },
      'resolved-before-created',
    ],
    [
      'Started after Resolved',
      { resolved: '2026-11-04', started: '2026-11-05' },
      'started-after-resolved',
    ],
  ])('%s → %s', (_, fields, reason) => {
    const r = row({ key: 'DM-9', ...fields });
    const result = toIssues([r]);
    expect(result.issues).toEqual([]);
    expect(result.skipped).toEqual([{ rowNumber: r.rowNumber, key: 'DM-9', reason }]);
  });

  it('reports the first problem only (invalid Created wins over invalid Resolved)', () => {
    const result = toIssues([row({ created: 'x', resolved: 'y' })]);
    expect(result.skipped.map((s) => s.reason)).toEqual(['invalid-created']);
  });

  it('keeps the first row of a duplicate key and skips later ones', () => {
    const first = row({ key: 'DM-1', created: '2026-11-01' });
    const second = row({ key: 'DM-1', created: '2026-11-02' });
    const third = row({ key: 'DM-1', created: '2026-11-03' });
    const result = toIssues([first, second, third]);
    expect(result.issues.map((i) => i.created)).toEqual([d('2026-11-01')]);
    expect(result.skipped).toEqual([
      { rowNumber: second.rowNumber, key: 'DM-1', reason: 'duplicate-key' },
      { rowNumber: third.rowNumber, key: 'DM-1', reason: 'duplicate-key' },
    ]);
  });

  it('keeps a later row when the earlier row with that key was skipped for a bad date', () => {
    const bad = row({ key: 'DM-1', created: 'x' });
    const good = row({ key: 'DM-1', created: '2026-11-02' });
    const result = toIssues([bad, good]);
    expect(result.issues).toHaveLength(1);
    expect(result.skipped.map((s) => s.reason)).toEqual(['invalid-created']);
  });

  it('records each skipped row separately and keeps the valid ones in order', () => {
    const result = toIssues([
      row({ key: 'A' }),
      row({ key: 'B', created: '' }),
      row({ key: 'C' }),
      row({ key: 'D', resolved: 'nope' }),
    ]);
    expect(result.issues.map((i) => i.key)).toEqual(['A', 'C']);
    expect(result.skipped.map((s) => s.key)).toEqual(['B', 'D']);
  });
});

describe('skipped row display helpers', () => {
  it.each<[SkipReason, string]>([
    ['invalid-created', 'Created is empty or not a valid date'],
    ['invalid-resolved', 'Resolved is not a valid date'],
    ['invalid-started', 'Started is not a valid date'],
    ['resolved-before-created', 'Resolved is earlier than Created'],
    ['started-after-resolved', 'Started is later than Resolved'],
    ['duplicate-key', 'Duplicate issue key; the first row was kept'],
  ])('%s → "%s"', (reason, text) => {
    expect(skipReasonText(reason)).toBe(text);
  });

  it('labels a skipped row by key, or by row number when the key is empty', () => {
    expect(skippedRowLabel({ rowNumber: 17, key: 'DM-4', reason: 'invalid-created' })).toBe('DM-4');
    expect(skippedRowLabel({ rowNumber: 17, key: '', reason: 'invalid-created' })).toBe('row 17');
  });

  it('summarises Started-before-Created issues', () => {
    expect(startedBeforeCreatedText([])).toBeNull();
    expect(startedBeforeCreatedText([{ rowNumber: 8, key: 'MS-7' }])).toBe(
      'Started before Created: 1 issue, cycle time adjusted (MS-7)',
    );
    expect(
      startedBeforeCreatedText([
        { rowNumber: 8, key: 'MS-7' },
        { rowNumber: 12, key: '' },
      ]),
    ).toBe('Started before Created: 2 issues, cycle time adjusted (MS-7, row 12)');
  });
});
