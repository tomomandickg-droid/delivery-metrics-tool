import { describe, expect, it } from 'vitest';
import {
  formatDays,
  formatNumber,
  formatRange,
  formatWeekLabel,
  pluralIssues,
} from '../../src/ui/format';
import { d } from './helpers';

describe('UI number and date formatting', () => {
  it.each([
    [6.3999999999999995, '6.4'],
    [5, '5'],
    [12.583333, '12.6'],
    [9.75, '9.8'],
    [1234.5, '1,234.5'],
    [0, '0'],
  ])('formatNumber(%d) = %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });

  it('formatDays uses the singular only for exactly 1', () => {
    expect(formatDays(1)).toBe('1 day');
    expect(formatDays(1.04)).toBe('1 day');
    expect(formatDays(1.5)).toBe('1.5 days');
    expect(formatDays(18.2)).toBe('18.2 days');
  });

  it('pluralIssues', () => {
    expect(pluralIssues(1)).toBe('1 issue');
    expect(pluralIssues(0)).toBe('0 issues');
    expect(pluralIssues(7)).toBe('7 issues');
  });

  it('formatRange drops the first year when both dates are in the same year', () => {
    expect(formatRange(d('2026-08-31'), d('2026-11-22'))).toBe('31 Aug – 22 Nov 2026');
    expect(formatRange(d('2026-10-19'), d('2027-01-10'))).toBe('19 Oct 2026 – 10 Jan 2027');
  });

  it('formatWeekLabel', () => {
    expect(formatWeekLabel(d('2026-08-31'))).toBe('31 Aug');
  });
});
