import { describe, expect, it } from 'vitest';
import { formatIso } from '../../src/domain/dates';
import { throughput } from '../../src/domain/metrics/throughput';
import { reportingWindow } from '../../src/domain/window';
import { d, issue } from './helpers';

// Today Fri 27 Nov 2026 → window Mon 31 Aug … Sun 22 Nov 2026.
const window = reportingWindow(d('2026-11-27'));

const resolvedOn = (key: string, resolved: string) => issue(key, { created: '2026-06-01', resolved });

describe('throughput (plan.md §6.1)', () => {
  it('counts issues per Monday–Sunday week, with 0 for empty weeks', () => {
    const result = throughput(
      [
        resolvedOn('A', '2026-08-31'), // week 1, Monday
        resolvedOn('B', '2026-09-06'), // week 1, Sunday
        resolvedOn('C', '2026-09-07'), // week 2, Monday
        resolvedOn('D', '2026-11-22'), // week 12, Sunday
      ],
      window,
    );
    expect(result.weeks.map((w) => w.count)).toEqual([2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    expect(result.weeks.map((w) => formatIso(w.weekStart))[0]).toBe('2026-08-31');
    expect(result.weeks.map((w) => formatIso(w.weekStart))[11]).toBe('2026-11-16');
    expect(result.total).toBe(4);
  });

  it('leaves out issues resolved before the window and in the current partial week', () => {
    const result = throughput(
      [
        resolvedOn('before', '2026-08-30'), // Sunday before week 1
        resolvedOn('current', '2026-11-23'), // Monday of the current week
        resolvedOn('today', '2026-11-27'),
        resolvedOn('in', '2026-10-01'),
      ],
      window,
    );
    expect(result.total).toBe(1);
  });

  it('leaves out unresolved issues', () => {
    const result = throughput([issue('open', { created: '2026-10-01', started: '2026-10-02' })], window);
    expect(result.total).toBe(0);
  });

  it('averages over all 12 weeks, including weeks with 0', () => {
    const issues = Array.from({ length: 30 }, (_, i) => resolvedOn(`I-${i}`, '2026-10-14'));
    const result = throughput(issues, window);
    expect(result.total).toBe(30);
    expect(result.averagePerWeek).toBe(2.5); // 30 ÷ 12, though all 30 are in one week
  });

  it('returns 12 zero weeks and an average of 0 when nothing is resolved', () => {
    const result = throughput([], window);
    expect(result.weeks).toHaveLength(12);
    expect(result.weeks.every((w) => w.count === 0)).toBe(true);
    expect(result.averagePerWeek).toBe(0);
  });
});
