import { describe, expect, it } from 'vitest';
import {
  matchColumns,
  missingColumnsMessage,
  normalizeHeader,
  REQUIRED_COLUMNS,
} from '../../src/domain/columns';

const ALL = [...REQUIRED_COLUMNS];

describe('normalizeHeader', () => {
  it('removes a byte-order mark, trims, collapses spaces and lowercases', () => {
    expect(normalizeHeader('﻿  Issue   KEY ')).toBe('issue key');
  });
});

describe('matchColumns', () => {
  it('finds every column in any order among other columns', () => {
    const result = matchColumns(['Summary', 'Started', 'Status', 'Issue key', 'Priority', 'Resolved', 'Created', 'Issue Type']);
    expect(result).toEqual({
      ok: true,
      indexes: { 'Issue key': 3, 'Issue Type': 7, Status: 2, Created: 6, Resolved: 5, Started: 1 },
    });
  });

  it('ignores case and spaces', () => {
    expect(matchColumns(['issue KEY', ' issue type ', 'STATUS', 'created', 'resolved', 'started']).ok).toBe(true);
  });

  it('accepts "Custom field (Started)" for Started', () => {
    const result = matchColumns([...ALL.slice(0, 5), 'Custom field (Started)']);
    expect(result).toEqual({ ok: true, indexes: expect.objectContaining({ Started: 5 }) });
  });

  it('uses the first of repeated headers (e.g. Jira repeats Sprint, sometimes Status)', () => {
    const result = matchColumns(['Sprint', 'Status', 'Sprint', ...ALL]);
    expect(result).toEqual({ ok: true, indexes: expect.objectContaining({ Status: 1 }) });
  });

  it.each(REQUIRED_COLUMNS)('reports "%s" when only that column is missing', (column) => {
    const result = matchColumns(ALL.filter((c) => c !== column));
    expect(result).toEqual({ ok: false, missing: [column] });
  });

  it('reports every missing column, in the standard order', () => {
    expect(matchColumns(['Started', 'Issue key', 'Status'])).toEqual({
      ok: false,
      missing: ['Issue Type', 'Created', 'Resolved'],
    });
  });

  it('does not accept a near miss such as "Resolution" for Resolved', () => {
    expect(matchColumns([...ALL.slice(0, 4), 'Resolution', 'Started'])).toEqual({
      ok: false,
      missing: ['Resolved'],
    });
  });
});

describe('missingColumnsMessage', () => {
  it('names one column', () => {
    expect(missingColumnsMessage(['Started'])).toBe('Missing required column: "Started"');
  });

  it('names several columns', () => {
    expect(missingColumnsMessage(['Resolved', 'Started'])).toBe(
      'Missing required columns: "Resolved", "Started"',
    );
  });
});
