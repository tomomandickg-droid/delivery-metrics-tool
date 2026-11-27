/**
 * Deterministic generator for the sample Jira export (plan.md §8.1).
 *
 * Same options → same output, byte for byte, on every machine: it never reads the clock,
 * and it uses only a seeded integer random generator and weighted tables. Math.log/exp/cos
 * are avoided on purpose, because their last digits are not guaranteed across platforms.
 */
import { addDays, fromYmd, toYmd } from '../src/domain/dates';
import type { CalendarDate } from '../src/domain/types';

export interface SampleOptions {
  /** Number of valid issues (the 5 deliberately invalid rows come on top). Default 300. */
  readonly count?: number;
  /** Random seed. Default 20261127. */
  readonly seed?: number;
}

/** The sample's export date: Friday 27 Nov 2026. */
export const SAMPLE_EXPORT_DATE_ISO = '2026-11-27';
const EXPORT_DATE = fromYmd(2026, 11, 27) as CalendarDate;
const HISTORY_DAYS = 140; // 20 weeks of created dates before the export date
const DEFAULT_COUNT = 300;
const DEFAULT_SEED = 20261127;

// ---------------------------------------------------------------- random numbers

/** mulberry32: small, fast, seeded; returns integers so results are exact everywhere. */
function createRandom(seed: number) {
  let state = seed >>> 0;
  const nextUint = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  /** Integer in [0, n). */
  const int = (n: number) => nextUint() % n;
  /** true with probability percent / 100. */
  const chance = (percent: number) => int(100) < percent;
  /** Picks a value from [value, weight] pairs with integer weights. */
  const weighted = <T>(table: readonly (readonly [T, number])[]): T => {
    const total = table.reduce((sum, [, w]) => sum + w, 0);
    let roll = int(total);
    for (const [value, w] of table) {
      if (roll < w) return value;
      roll -= w;
    }
    /* c8 ignore next */
    throw new Error('unreachable');
  };
  const pick = <T>(list: readonly T[]): T => list[int(list.length)] as T;
  return { int, chance, weighted, pick };
}

type Random = ReturnType<typeof createRandom>;

// ---------------------------------------------------------------- tables

const TYPES = [
  ['Story', 55],
  ['Bug', 30],
  ['Task', 15],
] as const;

// Days from Created to Started: right-skewed, most work starts within a few days.
const WAIT_DAYS = [
  [0, 25],
  [1, 20],
  [2, 15],
  [3, 10],
  [5, 10],
  [7, 8],
  [10, 6],
  [14, 4],
  [21, 2],
] as const;

// Cycle time in inclusive days: right-skewed with a long tail, as real delivery data is.
const CYCLE_DAYS = [
  [1, 8],
  [2, 12],
  [3, 14],
  [4, 13],
  [5, 11],
  [6, 9],
  [7, 7],
  [8, 6],
  [9, 5],
  [10, 4],
  [12, 4],
  [14, 3],
  [17, 2],
  [21, 2],
  [28, 1],
  [35, 1],
] as const;

const PRIORITIES = [
  ['Highest', 5],
  ['High', 25],
  ['Medium', 50],
  ['Low', 20],
] as const;

// Made-up names.
const ASSIGNEES = [
  'Ana Kovač',
  'Ben Okafor',
  'Chloé Martin',
  'Dario Rossi',
  'Elif Yılmaz',
  'Finn Larsen',
  'Grace Liu',
  'Hiro Tanaka',
] as const;

const VERBS = ['Add', 'Fix', 'Improve', 'Refactor', 'Remove', 'Update', 'Validate', 'Speed up'];
const THINGS = [
  'login page',
  'password reset',
  'invoice export',
  'search filters',
  'user settings',
  'audit log',
  'CSV import',
  'email templates',
  'dashboard widgets',
  'API rate limits',
  'mobile layout',
  'billing page',
  'notifications',
  'report builder',
  'file upload',
  'onboarding flow',
];

// ---------------------------------------------------------------- formatting

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n: number) => String(n).padStart(2, '0');

/** Formats a date in one of the three supported formats, mostly Jira's default. */
function formatSampleDate(date: CalendarDate, rnd: Random): string {
  const { year, month, day } = toYmd(date);
  const hour = 8 + rnd.int(11); // 08–18
  const minute = rnd.int(60);
  const format = rnd.weighted([
    ['jira', 75],
    ['iso', 15],
    ['dotted', 10],
  ] as const);
  if (format === 'jira') {
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${pad2(day)}/${MONTHS[month - 1]}/${pad2(year % 100)} ${h12}:${pad2(minute)} ${ampm}`;
  }
  if (format === 'iso') {
    const base = `${year}-${pad2(month)}-${pad2(day)}`;
    return rnd.chance(50) ? base : `${base} ${pad2(hour)}:${pad2(minute)}`;
  }
  const base = `${pad2(day)}.${pad2(month)}.${year}${rnd.chance(50) ? '.' : ''}`;
  return rnd.chance(70) ? base : `${base} ${pad2(hour)}:${pad2(minute)}`;
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// ---------------------------------------------------------------- generation

interface SampleIssue {
  keyNumber: number;
  summary: string;
  type: string;
  status: string;
  priority: string;
  assignee: string;
  created: CalendarDate;
  started?: CalendarDate;
  resolved?: CalendarDate;
}

function makeSummary(rnd: Random): string {
  const base = `${rnd.pick(VERBS)} ${rnd.pick(THINGS)}`;
  if (rnd.chance(12)) return `${base}, phase ${2 + rnd.int(3)}`; // comma → quoted cell
  if (rnd.chance(3)) return `${base} ("${rnd.pick(['Save', 'Next', 'Export'])}" button)`; // quotes
  return base;
}

function makeIssue(rnd: Random): Omit<SampleIssue, 'keyNumber'> {
  const created = addDays(EXPORT_DATE, -HISTORY_DAYS + rnd.int(HISTORY_DAYS));
  const type = rnd.weighted(TYPES);
  const base = {
    summary: makeSummary(rnd),
    type,
    priority: rnd.weighted(PRIORITIES),
    created,
  };
  const assignee = rnd.pick(ASSIGNEES);

  // About 18% are never started: backlog, often unassigned.
  if (rnd.chance(18)) {
    return { ...base, status: 'To Do', assignee: rnd.chance(50) ? '' : assignee };
  }

  let started: CalendarDate;
  let resolved: CalendarDate;
  if (rnd.chance(3)) {
    // Same-day item: created, started and resolved on one day (lead time 1).
    started = created;
    resolved = created;
  } else if (rnd.chance(2)) {
    // Started 1–3 days before Created (cycle time is counted from Created).
    started = addDays(created, -(1 + rnd.int(3)));
    resolved = addDays(created, rnd.weighted(CYCLE_DAYS) - 1);
  } else {
    started = addDays(created, rnd.weighted(WAIT_DAYS));
    resolved = addDays(started, rnd.weighted(CYCLE_DAYS) - 1);
  }

  if (started > EXPORT_DATE) {
    return { ...base, status: 'To Do', assignee };
  }
  if (resolved > EXPORT_DATE) {
    return { ...base, status: rnd.chance(70) ? 'In Progress' : 'In Review', assignee, started };
  }
  const status = rnd.chance(90) ? 'Done' : 'Closed';
  // About 5% of resolved issues lack a Started date (the automation rule did not run).
  if (rnd.chance(5)) return { ...base, status, assignee, resolved };
  return { ...base, status, assignee, started, resolved };
}

const HEADER = [
  'Summary',
  'Issue key',
  'Issue Type',
  'Status',
  'Priority',
  'Assignee',
  'Created',
  'Resolved',
  'Sprint',
  'Sprint',
  'Custom field (Started)',
];

/** Two-week sprints counted from the start of the history. */
function sprintsFor(issue: SampleIssue): [string, string] {
  if (issue.started === undefined) return ['', ''];
  const first = addDays(EXPORT_DATE, -HISTORY_DAYS - 14);
  const sprint = (date: CalendarDate) => `DMT Sprint ${1 + Math.floor((date - first) / 14)}`;
  const start = sprint(issue.started < first ? first : issue.started);
  const end = sprint(issue.resolved ?? EXPORT_DATE);
  return start === end ? [start, ''] : [start, end];
}

/** Generates the sample CSV text (LF line endings, trailing newline). */
export function generateSampleCsv(options: SampleOptions = {}): string {
  const count = options.count ?? DEFAULT_COUNT;
  const rnd = createRandom(options.seed ?? DEFAULT_SEED);

  // Keys follow creation order, as in Jira.
  const issues: SampleIssue[] = Array.from({ length: count }, () => makeIssue(rnd))
    .map((issue, index) => ({ issue, index }))
    .sort((a, b) => a.issue.created - b.issue.created || a.index - b.index)
    .map(({ issue }, i) => ({ ...issue, keyNumber: i + 1 }));

  const dateCell = (date: CalendarDate | undefined) =>
    date === undefined ? '' : formatSampleDate(date, rnd);

  const rowFor = (issue: SampleIssue): string[] => {
    const [sprint1, sprint2] = sprintsFor(issue);
    return [
      issue.summary,
      `DMT-${issue.keyNumber}`,
      issue.type,
      issue.status,
      issue.priority,
      issue.assignee,
      dateCell(issue.created),
      dateCell(issue.resolved),
      sprint1,
      sprint2,
      dateCell(issue.started),
    ];
  };

  // Jira lists the newest issue first.
  const rows = [...issues].reverse().map(rowFor);

  // Five deliberately invalid rows, one per kind, at random positions (plan.md §8.1).
  const resolvedIssue = issues.find((i) => i.resolved !== undefined && i.started !== undefined);
  const dup = resolvedIssue ?? (issues[0] as SampleIssue);
  const next = count + 1;
  const invalid: string[][] = [
    [
      'Import legacy tickets',
      `DMT-${next}`,
      'Task',
      'Done',
      'Low',
      'Ana Kovač',
      '31.02.2026',
      '2026-11-02',
      '',
      '',
      '2026-10-28',
    ],
    [
      'Fix timezone label',
      `DMT-${next + 1}`,
      'Bug',
      'Done',
      'Medium',
      'Ben Okafor',
      '2026-11-10',
      '2026-11-05',
      '',
      '',
      '',
    ],
    [
      'Archive old reports',
      `DMT-${next + 2}`,
      'Story',
      'Done',
      'Low',
      'Grace Liu',
      '2026-10-01',
      '2026-10-09',
      '',
      '',
      '2026-10-12',
    ],
    [
      'Translate settings page',
      `DMT-${next + 3}`,
      'Story',
      'In Progress',
      'Medium',
      'Finn Larsen',
      '2026-11-16',
      '',
      '',
      '',
      'n/a',
    ],
  ];
  for (const row of invalid) {
    rows.splice(rnd.int(rows.length + 1), 0, row);
  }
  // The duplicate goes somewhere after the original row, so the original is the one kept.
  const dupKey = `DMT-${dup.keyNumber}`;
  const originalIndex = rows.findIndex((r) => r[1] === dupKey);
  const after = originalIndex + 1 + rnd.int(rows.length - originalIndex);
  rows.splice(after, 0, [
    `${dup.summary} (copy)`,
    dupKey,
    dup.type,
    'Done',
    'Medium',
    'Hiro Tanaka',
    '2026-09-01',
    '2026-09-04',
    '',
    '',
    '2026-09-02',
  ]);

  return [HEADER, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
