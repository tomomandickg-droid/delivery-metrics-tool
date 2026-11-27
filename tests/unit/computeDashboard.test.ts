import { describe, expect, it } from 'vitest';
import { computeDashboard } from '../../src/domain/computeDashboard';
import { formatIso } from '../../src/domain/dates';
import { d, issue } from './helpers';

const TODAY = d('2026-11-27'); // window Mon 31 Aug … Sun 22 Nov 2026

const issues = [
  // Stories: lead 6 and 2, cycle 5 and 2; one WIP
  issue('S1', { type: 'Story', created: '2026-11-01', started: '2026-11-02', resolved: '2026-11-06' }),
  issue('S2', { type: 'Story', created: '2026-10-05', started: '2026-10-05', resolved: '2026-10-06' }),
  issue('S3', { type: 'Story', status: 'In Progress', created: '2026-11-10', started: '2026-11-12' }),
  // Bugs: lead 1, no Started; one WIP; one resolved in the current week (outside the window)
  issue('B1', { type: 'Bug', created: '2026-09-15', resolved: '2026-09-15' }),
  issue('B2', { type: 'Bug', status: 'In Review', created: '2026-11-15', started: '2026-11-16' }),
  issue('B3', { type: 'Bug', created: '2026-11-20', started: '2026-11-21', resolved: '2026-11-24' }),
  // Task: backlog only
  issue('T1', { type: 'Task', status: 'To Do', created: '2026-11-01' }),
];

describe('computeDashboard', () => {
  it('computes every metric for all types', () => {
    const result = computeDashboard(issues, new Set(['Story', 'Bug', 'Task']), TODAY);
    expect(formatIso(result.window.start)).toBe('2026-08-31');
    expect(result.issueCount).toBe(7);
    expect(result.throughput.total).toBe(3); // S1, S2, B1 (B3 is in the current week)
    expect(result.throughput.averagePerWeek).toBe(0.25);
    expect(result.leadTime.values).toEqual([1, 2, 6]);
    expect(result.cycleTime.values).toEqual([2, 5]);
    expect(result.cycleTime.withoutStarted).toBe(1); // B1
    expect(result.wip.total).toBe(2); // S3, B2
    expect(formatIso(result.latestResolved!)).toBe('2026-11-24');
  });

  it('recalculates every metric for one selected type', () => {
    const result = computeDashboard(issues, new Set(['Bug']), TODAY);
    expect(result.issueCount).toBe(3);
    expect(result.throughput.total).toBe(1);
    expect(result.leadTime.values).toEqual([1]);
    expect(result.cycleTime.n).toBe(0);
    expect(result.cycleTime.withoutStarted).toBe(1);
    expect(result.wip.byStatus).toEqual([{ status: 'In Review', count: 1 }]);
  });

  it('combines several selected types', () => {
    const result = computeDashboard(issues, new Set(['Story', 'Task']), TODAY);
    expect(result.issueCount).toBe(4);
    expect(result.leadTime.values).toEqual([2, 6]);
    expect(result.wip.byStatus).toEqual([{ status: 'In Progress', count: 1 }]);
  });

  it('shows no data when no type is selected', () => {
    const result = computeDashboard(issues, new Set(), TODAY);
    expect(result.issueCount).toBe(0);
    expect(result.throughput.total).toBe(0);
    expect(result.leadTime.median).toBeNull();
    expect(result.cycleTime.median).toBeNull();
    expect(result.wip.total).toBe(0);
  });

  it('keeps the window and latest Resolved date independent of the filter', () => {
    const all = computeDashboard(issues, new Set(['Story', 'Bug', 'Task']), TODAY);
    const tasks = computeDashboard(issues, new Set(['Task']), TODAY);
    expect(tasks.window).toEqual(all.window);
    expect(tasks.latestResolved).toBe(all.latestResolved);
  });

  it('reports latest Resolved as null when nothing is resolved', () => {
    const open = [issue('T1', { created: '2026-11-01' })];
    expect(computeDashboard(open, new Set(['Story']), TODAY).latestResolved).toBeNull();
  });

  it('finds the latest Resolved date whatever the order of issues', () => {
    const shuffled = [...issues].reverse();
    expect(computeDashboard(shuffled, new Set(), TODAY).latestResolved).toBe(d('2026-11-24'));
  });

  it('gives an empty window for an old export, while latest Resolved explains why', () => {
    const old = [issue('O1', { created: '2026-05-01', resolved: '2026-06-14' })];
    const result = computeDashboard(old, new Set(['Story']), TODAY);
    expect(result.throughput.total).toBe(0);
    expect(formatIso(result.latestResolved!)).toBe('2026-06-14');
  });
});
