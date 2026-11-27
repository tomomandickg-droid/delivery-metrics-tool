import { describe, expect, it } from 'vitest';
import { NO_STATUS_LABEL, wip } from '../../src/domain/metrics/wip';
import { issue } from './helpers';

describe('wip (plan.md §6.5)', () => {
  it('counts issues with Started and no Resolved, grouped by status, largest first', () => {
    const result = wip([
      issue('A', { status: 'In Review', created: '2026-11-01', started: '2026-11-02' }),
      issue('B', { status: 'In Progress', created: '2026-11-01', started: '2026-11-02' }),
      issue('C', { status: 'In Progress', created: '2026-11-01', started: '2026-11-03' }),
      issue('D', { status: 'Blocked', created: '2026-11-01', started: '2026-11-03' }),
    ]);
    expect(result).toEqual({
      total: 4,
      byStatus: [
        { status: 'In Progress', count: 2 },
        { status: 'Blocked', count: 1 },
        { status: 'In Review', count: 1 },
      ],
    });
  });

  it('does not count backlog (no Started) or done (has Resolved) issues', () => {
    const result = wip([
      issue('backlog', { status: 'To Do', created: '2026-11-01' }),
      issue('done', {
        status: 'Done',
        created: '2026-11-01',
        started: '2026-11-02',
        resolved: '2026-11-03',
      }),
      issue('done-no-start', { status: 'Done', created: '2026-11-01', resolved: '2026-11-03' }),
    ]);
    expect(result).toEqual({ total: 0, byStatus: [] });
  });

  it('uses dates, not the status name: Status "Done" with no Resolved date is still WIP', () => {
    const result = wip([
      issue('A', { status: 'Done', created: '2026-11-01', started: '2026-11-02' }),
    ]);
    expect(result.byStatus).toEqual([{ status: 'Done', count: 1 }]);
  });

  it('groups an empty status as "(no status)"', () => {
    const result = wip([issue('A', { status: '', created: '2026-11-01', started: '2026-11-02' })]);
    expect(result.byStatus).toEqual([{ status: NO_STATUS_LABEL, count: 1 }]);
  });

  it('is not limited to the reporting window (an issue started long ago is still WIP)', () => {
    const result = wip([
      issue('A', { status: 'In Progress', created: '2025-01-01', started: '2025-01-02' }),
    ]);
    expect(result.total).toBe(1);
  });
});
