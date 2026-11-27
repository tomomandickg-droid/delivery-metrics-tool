// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatIso } from '../../src/domain/dates';
import { SAMPLE_EXPORT_DATE } from '../../src/domain/shiftSample';
import { loadCsvText } from '../../src/ui/loadData';
import { d } from './helpers';

const sample = readFileSync(
  new URL('../../public/sample-data/jira-sample.csv', import.meta.url),
  'utf8',
);
const manual = readFileSync(new URL('../fixtures/manual-small.csv', import.meta.url), 'utf8');

describe('loadCsvText', () => {
  it('returns the parse error message for a bad file', () => {
    expect(loadCsvText('Issue key\nA', 'x.csv', false, SAMPLE_EXPORT_DATE)).toEqual({
      kind: 'error',
      fileName: 'x.csv',
      message: 'Missing required columns: "Issue Type", "Status", "Created", "Resolved", "Started"',
    });
  });

  it('keeps real dates for an uploaded file, whatever today is', () => {
    const r = loadCsvText(manual, 'm.csv', false, d('2027-06-01'));
    if (r.kind !== 'loaded') throw new Error('expected loaded');
    expect(r.shiftDays).toBe(0);
    expect(formatIso(r.issues[0]!.created)).toBe('2026-11-01');
    expect(r.skipped).toHaveLength(6);
    expect(r.startedBeforeCreated).toEqual([{ rowNumber: 8, key: 'MS-7' }]);
    expect(r.types).toEqual(['Bug', 'Story', 'Task']);
  });

  it('does not shift the sample in its own export week', () => {
    const r = loadCsvText(sample, 'jira-sample.csv', true, SAMPLE_EXPORT_DATE);
    if (r.kind !== 'loaded') throw new Error('expected loaded');
    expect(r.shiftDays).toBe(0);
  });

  it('shifts the sample by whole weeks on a later date', () => {
    const atExport = loadCsvText(sample, 'jira-sample.csv', true, SAMPLE_EXPORT_DATE);
    const later = loadCsvText(sample, 'jira-sample.csv', true, d('2027-03-03'));
    if (atExport.kind !== 'loaded' || later.kind !== 'loaded') throw new Error('expected loaded');
    expect(later.shiftDays).toBe(98);
    expect(later.issues[0]!.created - atExport.issues[0]!.created).toBe(98);
    expect(later.skipped).toEqual(atExport.skipped);
  });
});
