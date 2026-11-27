// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeDashboard } from '../../src/domain/computeDashboard';
import { formatIso, inclusiveDays } from '../../src/domain/dates';
import { parseCsv } from '../../src/domain/parseCsv';
import { round1 } from '../../src/domain/stats';
import { toIssues } from '../../src/domain/toIssues';
import { d } from './helpers';

// Every expected number below comes from tests/fixtures/manual-small.expected.md.
const csv = readFileSync(new URL('../fixtures/manual-small.csv', import.meta.url), 'utf8');
const TODAY = d('2026-11-27');

const parsed = parseCsv(csv);
if (!parsed.ok) throw new Error(`Fixture did not parse: ${parsed.message}`);
const { issues, skipped } = toIssues(parsed.rows);
const ALL_TYPES = new Set(['Story', 'Bug', 'Task']);

const byKey = (key: string) => {
  const found = issues.find((i) => i.key === key);
  if (!found) throw new Error(`No kept issue ${key}`);
  return found;
};

describe('manual-small.csv §2: skipped rows', () => {
  it('skips exactly the 6 rows in the hand calculation', () => {
    expect(skipped).toEqual([
      { rowNumber: 15, key: 'MS-14', reason: 'invalid-created' },
      { rowNumber: 16, key: 'MS-15', reason: 'resolved-before-created' },
      { rowNumber: 17, key: 'MS-16', reason: 'started-after-resolved' },
      { rowNumber: 18, key: 'MS-1', reason: 'duplicate-key' },
      { rowNumber: 19, key: 'MS-17', reason: 'invalid-resolved' },
      { rowNumber: 20, key: 'MS-18', reason: 'invalid-started' },
    ]);
  });
});

describe('manual-small.csv §3: kept issues and their dates', () => {
  it('keeps 13 issues', () => {
    expect(issues.map((i) => i.key)).toEqual([
      'MS-1',
      'MS-2',
      'MS-3',
      'MS-4',
      'MS-5',
      'MS-6',
      'MS-7',
      'MS-8',
      'MS-9',
      'MS-10',
      'MS-11',
      'MS-12',
      'MS-13',
    ]);
  });

  it.each([
    // key, created, started, resolved (all three CSV date formats appear in these rows)
    ['MS-1', '2026-11-01', '2026-11-02', '2026-11-06'],
    ['MS-2', '2026-11-10', '2026-11-10', '2026-11-10'],
    ['MS-3', '2026-09-15', '2026-09-21', '2026-10-02'],
    ['MS-4', '2026-08-20', '2026-08-28', '2026-08-31'],
    ['MS-5', '2026-11-18', null, '2026-11-22'],
    ['MS-6', '2026-10-01', '2026-10-12', '2026-10-20'],
    ['MS-7', '2026-09-28', '2026-09-25', '2026-10-02'],
    ['MS-8', '2026-08-03', '2026-08-10', '2026-08-30'],
    ['MS-9', '2026-11-19', '2026-11-20', '2026-11-24'],
    ['MS-10', '2026-11-02', '2026-11-09', null],
    ['MS-11', '2026-11-12', '2026-11-13', null],
    ['MS-12', '2026-07-01', '2026-07-15', null],
    ['MS-13', '2026-11-20', null, null],
  ])('%s: created %s, started %s, resolved %s', (key, created, started, resolved) => {
    const i = byKey(key);
    expect(formatIso(i.created)).toBe(created);
    expect(i.started === undefined ? null : formatIso(i.started)).toBe(started);
    expect(i.resolved === undefined ? null : formatIso(i.resolved)).toBe(resolved);
  });
});

describe('manual-small.csv §4: per-issue lead and cycle time', () => {
  it.each([
    ['MS-1', 6, 5],
    ['MS-2', 1, 1],
    ['MS-3', 18, 12],
    ['MS-4', 12, 4],
    ['MS-5', 5, null],
    ['MS-6', 20, 9],
    ['MS-7', 5, 8],
  ])('%s: lead %i, cycle %s', (key, lead, cycle) => {
    const i = byKey(key);
    expect(inclusiveDays(i.created, i.resolved!)).toBe(lead);
    expect(i.started === undefined ? null : inclusiveDays(i.started, i.resolved!)).toBe(cycle);
  });
});

describe('manual-small.csv §5: all issue types', () => {
  const r = computeDashboard(issues, ALL_TYPES, TODAY);

  it('window is Mon 31 Aug – Sun 22 Nov 2026', () => {
    expect(formatIso(r.window.start)).toBe('2026-08-31');
    expect(formatIso(r.window.end)).toBe('2026-11-22');
  });

  it('throughput: 1,0,0,0,2,0,0,1,0,1,1,1 → total 7, average 0.6', () => {
    expect(r.throughput.weeks.map((w) => w.count)).toEqual([1, 0, 0, 0, 2, 0, 0, 1, 0, 1, 1, 1]);
    expect(r.throughput.total).toBe(7);
    expect(r.throughput.averagePerWeek).toBeCloseTo(7 / 12, 10);
    expect(round1(r.throughput.averagePerWeek)).toBe(0.6);
  });

  it('lead time: 1,5,5,6,12,18,20 → median 6, 85th 18.2', () => {
    expect(r.leadTime.values).toEqual([1, 5, 5, 6, 12, 18, 20]);
    expect(r.leadTime.median).toBe(6);
    expect(r.leadTime.p85).toBeCloseTo(18.2, 10);
  });

  it('cycle time: 1,4,5,8,9,12 → median 6.5, 85th 9.75 (shown 9.8), 1 without Started', () => {
    expect(r.cycleTime.values).toEqual([1, 4, 5, 8, 9, 12]);
    expect(r.cycleTime.median).toBe(6.5);
    expect(r.cycleTime.p85).toBeCloseTo(9.75, 10);
    expect(round1(r.cycleTime.p85!)).toBe(9.8);
    expect(r.cycleTime.withoutStarted).toBe(1);
  });

  it('WIP: 3 = In Progress 2, In Review 1', () => {
    expect(r.wip).toEqual({
      total: 3,
      byStatus: [
        { status: 'In Progress', count: 2 },
        { status: 'In Review', count: 1 },
      ],
    });
  });

  it('latest Resolved date is 24 Nov 2026', () => {
    expect(formatIso(r.latestResolved!)).toBe('2026-11-24');
  });
});

describe('manual-small.csv §6: Issue Type filter', () => {
  it('Bug only', () => {
    const r = computeDashboard(issues, new Set(['Bug']), TODAY);
    expect(r.throughput.weeks.map((w) => w.count)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
    expect(round1(r.throughput.averagePerWeek)).toBe(0.2);
    expect(r.leadTime.values).toEqual([1, 5]);
    expect(r.leadTime.median).toBe(3);
    expect(r.leadTime.p85).toBeCloseTo(4.4, 10);
    expect(r.cycleTime.values).toEqual([1]);
    expect(r.cycleTime.median).toBe(1);
    expect(r.cycleTime.p85).toBe(1);
    expect(r.cycleTime.withoutStarted).toBe(1);
    expect(r.wip.byStatus).toEqual([{ status: 'In Review', count: 1 }]);
  });

  it('Story and Task together', () => {
    const r = computeDashboard(issues, new Set(['Story', 'Task']), TODAY);
    expect(r.throughput.weeks.map((w) => w.count)).toEqual([1, 0, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0]);
    expect(r.throughput.total).toBe(5);
    expect(round1(r.throughput.averagePerWeek)).toBe(0.4);
    expect(r.leadTime.values).toEqual([5, 6, 12, 18, 20]);
    expect(r.leadTime.median).toBe(12);
    expect(r.leadTime.p85).toBeCloseTo(18.8, 10);
    expect(r.cycleTime.values).toEqual([4, 5, 8, 9, 12]);
    expect(r.cycleTime.median).toBe(8);
    expect(r.cycleTime.p85).toBeCloseTo(10.2, 10);
    expect(r.cycleTime.withoutStarted).toBe(0);
    expect(r.wip.byStatus).toEqual([{ status: 'In Progress', count: 2 }]);
  });

  it('no type selected', () => {
    const r = computeDashboard(issues, new Set(), TODAY);
    expect(r.throughput.total).toBe(0);
    expect(r.throughput.averagePerWeek).toBe(0);
    expect(r.leadTime).toEqual({ n: 0, values: [], median: null, p85: null });
    expect(r.cycleTime.n).toBe(0);
    expect(r.cycleTime.median).toBeNull();
    expect(r.wip.total).toBe(0);
  });
});
