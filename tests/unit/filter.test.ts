import { describe, expect, it } from 'vitest';
import { filterByTypes, issueTypes } from '../../src/domain/filter';
import { issue } from './helpers';

const issues = [
  issue('S1', { type: 'Story', created: '2026-11-01' }),
  issue('B1', { type: 'Bug', created: '2026-11-01' }),
  issue('T1', { type: 'Task', created: '2026-11-01' }),
  issue('S2', { type: 'Story', created: '2026-11-01' }),
  issue('E1', { type: 'epic', created: '2026-11-01' }),
];

describe('issueTypes', () => {
  it('lists distinct types alphabetically, ignoring case for the order', () => {
    expect(issueTypes(issues)).toEqual(['Bug', 'epic', 'Story', 'Task']);
  });

  it('returns an empty list for no issues', () => {
    expect(issueTypes([])).toEqual([]);
  });
});

describe('filterByTypes', () => {
  it('keeps one type', () => {
    expect(filterByTypes(issues, new Set(['Story'])).map((i) => i.key)).toEqual(['S1', 'S2']);
  });

  it('keeps several types at once, in the original order', () => {
    expect(filterByTypes(issues, new Set(['Bug', 'Story'])).map((i) => i.key)).toEqual([
      'S1',
      'B1',
      'S2',
    ]);
  });

  it('keeps nothing when no type is selected', () => {
    expect(filterByTypes(issues, new Set())).toEqual([]);
  });

  it('matches the type exactly (case matters, as Jira writes it)', () => {
    expect(filterByTypes(issues, new Set(['story']))).toEqual([]);
  });
});
