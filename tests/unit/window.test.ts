import { describe, expect, it } from 'vitest';
import { dayOfWeek, formatIso, inclusiveDays } from '../../src/domain/dates';
import { isInWindow, reportingWindow, weekIndex, WINDOW_WEEKS } from '../../src/domain/window';
import { d } from './helpers';

const iso = formatIso;

describe('reportingWindow (plan.md §5)', () => {
  it('worked example: today Fri 27 Nov 2026 → Mon 31 Aug … Sun 22 Nov 2026', () => {
    const w = reportingWindow(d('2026-11-27'));
    expect(iso(w.start)).toBe('2026-08-31');
    expect(iso(w.end)).toBe('2026-11-22');
    expect(inclusiveDays(w.start, w.end)).toBe(84);
  });

  it('has 12 weeks, each starting on a Monday, oldest first', () => {
    const w = reportingWindow(d('2026-11-27'));
    expect(w.weekStarts).toHaveLength(WINDOW_WEEKS);
    expect(w.weekStarts.map(iso)).toEqual([
      '2026-08-31',
      '2026-09-07',
      '2026-09-14',
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ]);
    for (const monday of w.weekStarts) expect(dayOfWeek(monday)).toBe(1);
    expect(dayOfWeek(w.end)).toBe(7);
  });

  it('is the same window for every day of the current week (Mon 23 … Sun 29 Nov)', () => {
    const expected = reportingWindow(d('2026-11-27'));
    for (const day of ['2026-11-23', '2026-11-24', '2026-11-28', '2026-11-29']) {
      expect(reportingWindow(d(day))).toEqual(expected);
    }
  });

  it('moves forward one week on the next Monday (30 Nov)', () => {
    const w = reportingWindow(d('2026-11-30'));
    expect(iso(w.start)).toBe('2026-09-07');
    expect(iso(w.end)).toBe('2026-11-29');
  });

  it('crosses a year boundary: today Wed 13 Jan 2027', () => {
    const w = reportingWindow(d('2027-01-13'));
    // Current week starts Mon 11 Jan 2027; 84 days earlier is Mon 19 Oct 2026.
    expect(iso(w.start)).toBe('2026-10-19');
    expect(iso(w.end)).toBe('2027-01-10');
    expect(w.weekStarts.map(iso)).toContain('2026-12-28');
  });
});

describe('isInWindow / weekIndex', () => {
  const w = reportingWindow(d('2026-11-27'));

  it.each([
    ['2026-08-30', false, -1, 'Sunday before the window'],
    ['2026-08-31', true, 0, 'first Monday'],
    ['2026-09-06', true, 0, 'end of week 1'],
    ['2026-09-07', true, 1, 'start of week 2'],
    ['2026-11-16', true, 11, 'Monday of week 12'],
    ['2026-11-22', true, 11, 'last Sunday'],
    ['2026-11-23', false, -1, 'current week (partial, excluded)'],
    ['2026-11-27', false, -1, 'today'],
  ])('%s → in=%s, week=%i (%s)', (date, inWindow, index) => {
    expect(isInWindow(w, d(date))).toBe(inWindow);
    expect(weekIndex(w, d(date))).toBe(index);
  });
});
