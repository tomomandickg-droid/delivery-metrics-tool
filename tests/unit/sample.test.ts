// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { generateSampleCsv, SAMPLE_EXPORT_DATE_ISO } from '../../scripts/sampleGenerator';
import { computeDashboard } from '../../src/domain/computeDashboard';
import { formatIso, inclusiveDays } from '../../src/domain/dates';
import { cycleTime } from '../../src/domain/metrics/cycleTime';
import { leadTime } from '../../src/domain/metrics/leadTime';
import { parseCsv } from '../../src/domain/parseCsv';
import { toIssues } from '../../src/domain/toIssues';
import { isInWindow, reportingWindow } from '../../src/domain/window';
import { d } from './helpers';

const committed = readFileSync(
  new URL('../../public/sample-data/jira-sample.csv', import.meta.url),
  'utf8',
);

const parsed = parseCsv(committed);
if (!parsed.ok) throw new Error(`Sample did not parse: ${parsed.message}`);
const { issues, skipped, startedBeforeCreated } = toIssues(parsed.rows);
const TODAY = d(SAMPLE_EXPORT_DATE_ISO);
const window = reportingWindow(TODAY);

const byKey = (key: string) => {
  const found = issues.find((i) => i.key === key);
  if (!found) throw new Error(`No kept issue ${key}`);
  return found;
};

describe('sample generator: determinism', () => {
  it('regenerating gives exactly the committed file (run `npm run generate:sample` after a change)', () => {
    expect(generateSampleCsv()).toBe(committed);
  });

  it('gives the same output twice for the same options', () => {
    expect(generateSampleCsv({ count: 50, seed: 7 })).toBe(
      generateSampleCsv({ count: 50, seed: 7 }),
    );
  });

  it('gives different output for a different seed', () => {
    expect(generateSampleCsv({ seed: 1 })).not.toBe(committed);
  });

  it('honours --count (5,000 issues + 5 invalid rows for the performance check)', () => {
    const big = generateSampleCsv({ count: 5000 });
    expect(big.trimEnd().split('\n')).toHaveLength(1 + 5000 + 5);
  });

  it('uses LF line endings, a trailing newline and no byte-order mark', () => {
    expect(committed).not.toContain('\r');
    expect(committed.endsWith('\n')).toBe(true);
    expect(committed.charCodeAt(0)).not.toBe(0xfeff);
  });
});

describe('sample data: shape (plan.md §8.1)', () => {
  it('has Jira-like columns, including a repeated Sprint and "Custom field (Started)"', () => {
    expect(committed.split('\n')[0]).toBe(
      'Summary,Issue key,Issue Type,Status,Priority,Assignee,Created,Resolved,Sprint,Sprint,Custom field (Started)',
    );
  });

  it('keeps 300 issues and skips exactly the 5 deliberately invalid rows', () => {
    expect(issues).toHaveLength(300);
    expect(skipped.map((s) => s.reason).sort()).toEqual([
      'duplicate-key',
      'invalid-created',
      'invalid-started',
      'resolved-before-created',
      'started-after-resolved',
    ]);
  });

  it('skips the copy of a duplicate key, not the original', () => {
    const dup = skipped.find((s) => s.reason === 'duplicate-key')!;
    const line = committed.split('\n')[dup.rowNumber - 1]!;
    expect(line).toContain('(copy)');
  });

  it('has all three date formats', () => {
    const cells = parsed.rows.flatMap((r) => [r.created, r.resolved, r.started]);
    expect(cells.some((c) => /^\d{2}\/[A-Z][a-z]{2}\/\d{2} \d{1,2}:\d{2} [AP]M$/.test(c))).toBe(
      true,
    );
    expect(cells.some((c) => /^\d{4}-\d{2}-\d{2}/.test(c))).toBe(true);
    expect(cells.some((c) => /^\d{2}\.\d{2}\.\d{4}/.test(c))).toBe(true);
  });

  it('has a realistic mix of types and states, and every edge case', () => {
    const count = (f: (i: (typeof issues)[number]) => boolean) => issues.filter(f).length;
    const resolved = count((i) => i.resolved !== undefined);
    expect(resolved / issues.length).toBeGreaterThan(0.7);
    expect(resolved / issues.length).toBeLessThan(0.85);
    expect(count((i) => i.type === 'Story')).toBeGreaterThan(count((i) => i.type === 'Bug'));
    expect(count((i) => i.type === 'Bug')).toBeGreaterThan(count((i) => i.type === 'Task'));
    expect(count((i) => i.started !== undefined && i.resolved === undefined)).toBeGreaterThan(0); // WIP
    expect(count((i) => i.started === undefined && i.resolved === undefined)).toBeGreaterThan(0); // backlog
    expect(count((i) => i.resolved !== undefined && i.started === undefined)).toBeGreaterThan(0);
    expect(count((i) => i.resolved !== undefined && i.resolved === i.created)).toBeGreaterThan(0);
    expect(startedBeforeCreated.length).toBeGreaterThan(0);
  });

  it('has resolved issues in every week of the window, plus some before it and in the current week', () => {
    const r = computeDashboard(issues, new Set(['Story', 'Bug', 'Task']), TODAY);
    expect(r.throughput.weeks.every((w) => w.count > 0)).toBe(true);
    const resolvedOutside = issues.filter(
      (i) => i.resolved !== undefined && !isInWindow(window, i.resolved),
    );
    expect(resolvedOutside.some((i) => i.resolved! < window.start)).toBe(true);
    expect(resolvedOutside.some((i) => i.resolved! > window.end)).toBe(true);
  });
});

describe('sample data: 5 issues checked by hand (today = 27 Nov 2026)', () => {
  // Raw CSV values are quoted in each comment; the working is end − start + 1.
  it('DMT-200: Created 11/Oct/26, Started 13/Oct/26, Resolved 15/Oct/26 → lead 5, cycle 3, in W7', () => {
    const i = byKey('DMT-200');
    expect([i.created, i.started, i.resolved].map((x) => formatIso(x!))).toEqual([
      '2026-10-11',
      '2026-10-13',
      '2026-10-15',
    ]);
    expect(leadTime([i], window).values).toEqual([5]); // 15 − 11 + 1
    expect(cycleTime([i], window).values).toEqual([3]); // 15 − 13 + 1
  });

  it('DMT-150: Created 10/Sep/26, Started 10.09.2026, Resolved 11/Sep/26 → lead 2, cycle 2, in W2', () => {
    const i = byKey('DMT-150');
    expect(leadTime([i], window).values).toEqual([2]); // 11 − 10 + 1
    expect(cycleTime([i], window).values).toEqual([2]); // 11 − 10 + 1
  });

  it('DMT-238: Created 30/Oct/26, no Started, Resolved 15.11.2026. → lead 17, no cycle time, in W11', () => {
    const i = byKey('DMT-238');
    expect(i.started).toBeUndefined();
    expect(leadTime([i], window).values).toEqual([17]); // 30 Oct → 15 Nov: 1 + 15 = 16, + 1
    expect(cycleTime([i], window)).toMatchObject({ n: 0, withoutStarted: 1 });
  });

  it('DMT-83: Started 13/Aug/26 before Created 15/Aug/26, Resolved 15/Aug/26 → lead 1, cycle 1, adjusted, before window', () => {
    const i = byKey('DMT-83');
    expect(inclusiveDays(i.created, i.resolved!)).toBe(1);
    expect(startedBeforeCreated.map((s) => s.key)).toContain('DMT-83');
    expect(isInWindow(window, i.resolved!)).toBe(false);
    // Cycle time counts from Created: 15 Aug → 15 Aug = 1 (Started 13 Aug would give 3).
    const wideWindow = reportingWindow(d('2026-08-20'));
    expect(cycleTime([i], wideWindow).values).toEqual([1]);
  });

  it('DMT-297: Created 24.11.2026. 17:36, Started 2026-11-25 09:35, Resolved 27/Nov/26 → current week, left out', () => {
    const i = byKey('DMT-297');
    expect(inclusiveDays(i.created, i.resolved!)).toBe(4); // 27 − 24 + 1
    expect(inclusiveDays(i.started!, i.resolved!)).toBe(3); // 27 − 25 + 1
    expect(leadTime([i], window).n).toBe(0);
    expect(cycleTime([i], window).n).toBe(0);
  });
});
