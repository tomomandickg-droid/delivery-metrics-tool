import { describe, expect, it } from 'vitest';
import { cycleTime } from '../../src/domain/metrics/cycleTime';
import { leadTime } from '../../src/domain/metrics/leadTime';
import { reportingWindow } from '../../src/domain/window';
import { d, issue } from './helpers';

// Today Fri 27 Nov 2026 → window Mon 31 Aug … Sun 22 Nov 2026.
const window = reportingWindow(d('2026-11-27'));

describe('leadTime (plan.md §6.2)', () => {
  it('counts Created → Resolved inclusively', () => {
    const result = leadTime(
      [
        issue('same-day', { created: '2026-11-02', resolved: '2026-11-02' }), // 1
        issue('spec', { created: '2026-11-01', resolved: '2026-11-06' }), // 6
        issue('month', { created: '2026-09-28', resolved: '2026-10-03' }), // 6
      ],
      window,
    );
    expect(result.values).toEqual([1, 6, 6]);
    expect(result.n).toBe(3);
    expect(result.median).toBe(6);
  });

  it('uses only issues resolved in the window, even if created long before it', () => {
    const result = leadTime(
      [
        issue('old-create', { created: '2026-05-01', resolved: '2026-09-01' }), // in: 124
        issue('before', { created: '2026-08-01', resolved: '2026-08-30' }), // out
        issue('current-week', { created: '2026-11-20', resolved: '2026-11-23' }), // out
        issue('open', { created: '2026-10-01' }), // out
      ],
      window,
    );
    expect(result.values).toEqual([124]);
  });

  it('computes the median and 85th percentile with PERCENTILE.INC', () => {
    // Lead times 1, 2, 3, 4, 10 → median 3, 85th 6.4
    const result = leadTime(
      [
        issue('a', { created: '2026-10-05', resolved: '2026-10-05' }),
        issue('b', { created: '2026-10-05', resolved: '2026-10-06' }),
        issue('c', { created: '2026-10-05', resolved: '2026-10-07' }),
        issue('d', { created: '2026-10-05', resolved: '2026-10-08' }),
        issue('e', { created: '2026-10-05', resolved: '2026-10-14' }),
      ],
      window,
    );
    expect(result.median).toBe(3);
    expect(result.p85).toBeCloseTo(6.4, 10);
  });

  it('returns n = 0 and null statistics when nothing was resolved in the window', () => {
    expect(leadTime([issue('open', { created: '2026-10-01' })], window)).toEqual({
      n: 0,
      values: [],
      median: null,
      p85: null,
    });
  });
});

describe('cycleTime (plan.md §6.3)', () => {
  it('counts Started → Resolved inclusively', () => {
    const result = cycleTime(
      [
        issue('a', { created: '2026-10-01', started: '2026-10-05', resolved: '2026-10-05' }), // 1
        issue('b', { created: '2026-10-01', started: '2026-10-05', resolved: '2026-10-09' }), // 5
      ],
      window,
    );
    expect(result.values).toEqual([1, 5]);
    expect(result.median).toBe(3);
  });

  it('allows Started before Created (cycle time longer than lead time)', () => {
    const result = cycleTime(
      [issue('a', { created: '2026-10-05', started: '2026-10-01', resolved: '2026-10-06' })],
      window,
    );
    expect(result.values).toEqual([6]);
  });

  it('leaves out resolved issues without Started and counts them', () => {
    const result = cycleTime(
      [
        issue('started', { created: '2026-10-01', started: '2026-10-02', resolved: '2026-10-03' }),
        issue('no-start-1', { created: '2026-10-01', resolved: '2026-10-03' }),
        issue('no-start-2', { created: '2026-10-01', resolved: '2026-11-10' }),
        issue('no-start-outside', { created: '2026-10-01', resolved: '2026-11-25' }), // not in window
      ],
      window,
    );
    expect(result.n).toBe(1);
    expect(result.withoutStarted).toBe(2);
  });

  it('leaves out issues resolved outside the window and open issues', () => {
    const result = cycleTime(
      [
        issue('before', { created: '2026-08-01', started: '2026-08-02', resolved: '2026-08-30' }),
        issue('current', { created: '2026-11-01', started: '2026-11-02', resolved: '2026-11-24' }),
        issue('wip', { created: '2026-11-01', started: '2026-11-02' }),
      ],
      window,
    );
    expect(result).toEqual({ n: 0, values: [], median: null, p85: null, withoutStarted: 0 });
  });
});
