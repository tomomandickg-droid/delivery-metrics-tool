// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeDashboard } from '../../src/domain/computeDashboard';
import { addDays, dayOfWeek, formatIso, inclusiveDays } from '../../src/domain/dates';
import { parseCsv } from '../../src/domain/parseCsv';
import { SAMPLE_EXPORT_DATE, sampleShiftDays, shiftIssues } from '../../src/domain/shiftSample';
import { toIssues } from '../../src/domain/toIssues';
import { d, issue } from './helpers';

describe('SAMPLE_EXPORT_DATE', () => {
  it('is Friday 27 Nov 2026', () => {
    expect(formatIso(SAMPLE_EXPORT_DATE)).toBe('2026-11-27');
    expect(dayOfWeek(SAMPLE_EXPORT_DATE)).toBe(5);
  });
});

describe('sampleShiftDays (plan.md §8.2)', () => {
  it.each([
    ['2026-11-23', 0, 'Monday of the export week'],
    ['2026-11-27', 0, 'the export date itself'],
    ['2026-11-29', 0, 'Sunday of the export week'],
    ['2026-11-30', 7, 'next Monday'],
    ['2027-03-01', 98, '14 weeks later (23 Nov → 1 Mar = 98 days)'],
    ['2026-11-16', -7, 'a week before the export week'],
  ])('today %s → %i days (%s)', (today, expected) => {
    expect(sampleShiftDays(d(today))).toBe(expected);
  });

  it('is always a whole number of weeks', () => {
    for (let offset = 0; offset < 60; offset++) {
      expect(sampleShiftDays(addDays(d('2027-01-01'), offset)) % 7).toBe(0);
    }
  });

  it('accepts another export date', () => {
    expect(sampleShiftDays(d('2026-12-09'), d('2026-11-30'))).toBe(7);
  });
});

describe('shiftIssues', () => {
  const original = [
    issue('A', { created: '2026-10-01', started: '2026-10-02', resolved: '2026-10-06' }),
    issue('B', { created: '2026-11-20' }),
  ];

  it('moves every date by the shift and keeps empty dates empty', () => {
    const [a, b] = shiftIssues(original, 14);
    expect([a!.created, a!.started, a!.resolved].map((x) => formatIso(x!))).toEqual([
      '2026-10-15',
      '2026-10-16',
      '2026-10-20',
    ]);
    expect(formatIso(b!.created)).toBe('2026-12-04');
    expect(b).not.toHaveProperty('started');
    expect(b).not.toHaveProperty('resolved');
  });

  it('keeps weekdays and durations', () => {
    const [a] = shiftIssues(original, 7 * 30);
    const [o] = original;
    expect(dayOfWeek(a!.created)).toBe(dayOfWeek(o!.created));
    expect(inclusiveDays(a!.created, a!.resolved!)).toBe(inclusiveDays(o!.created, o!.resolved!));
  });

  it('keeps key, type and status and does not change the input', () => {
    const shifted = shiftIssues(original, 7);
    expect(shifted[0]).toMatchObject({ key: 'A', type: 'Story', status: 'Done' });
    expect(formatIso(original[0]!.created)).toBe('2026-10-01');
  });

  it.each([1, 6, 3.5, -2])('rejects a shift of %d days (not whole weeks)', (days) => {
    expect(() => shiftIssues(original, days)).toThrow(RangeError);
  });

  it('allows a zero or negative shift of whole weeks', () => {
    expect(shiftIssues(original, 0)).toEqual(original);
    expect(formatIso(shiftIssues(original, -7)[0]!.created)).toBe('2026-09-24');
  });
});

describe('shifted sample gives the same dashboard at any date', () => {
  const csv = readFileSync(
    new URL('../../public/sample-data/jira-sample.csv', import.meta.url),
    'utf8',
  );
  const parsed = parseCsv(csv);
  if (!parsed.ok) throw new Error(parsed.message);
  const { issues } = toIssues(parsed.rows);
  const types = new Set(['Story', 'Bug', 'Task']);
  const atExport = computeDashboard(issues, types, SAMPLE_EXPORT_DATE);

  it.each(['2026-11-24', '2026-12-01', '2027-03-03', '2028-07-16', '2026-11-12'])(
    'today %s: same counts, lead time, cycle time and WIP as on the export date',
    (today) => {
      const t = d(today);
      const shifted = computeDashboard(shiftIssues(issues, sampleShiftDays(t)), types, t);
      expect(shifted.throughput.weeks.map((w) => w.count)).toEqual(
        atExport.throughput.weeks.map((w) => w.count),
      );
      expect(shifted.leadTime).toEqual(atExport.leadTime);
      expect(shifted.cycleTime).toEqual(atExport.cycleTime);
      expect(shifted.wip).toEqual(atExport.wip);
      // Only the dates move, by the same whole number of weeks.
      expect(shifted.window.start - atExport.window.start).toBe(sampleShiftDays(t));
    },
  );

  it('without the shift, the sample would be empty three months later', () => {
    const later = computeDashboard(issues, types, d('2027-03-03'));
    expect(later.throughput.total).toBe(0);
  });
});
