import { issueTypes } from '../domain/filter';
import { parseCsv } from '../domain/parseCsv';
import { sampleShiftDays, shiftIssues } from '../domain/shiftSample';
import { toIssues } from '../domain/toIssues';
import type { AdjustedIssue, CalendarDate, Issue, SkippedRow } from '../domain/types';

export const SAMPLE_FILE_NAME = 'jira-sample.csv';

export interface LoadedData {
  readonly kind: 'loaded';
  readonly fileName: string;
  readonly isSample: boolean;
  /** Whole weeks the sample was moved by (0 for an uploaded file). */
  readonly shiftDays: number;
  readonly issues: readonly Issue[];
  readonly skipped: readonly SkippedRow[];
  readonly startedBeforeCreated: readonly AdjustedIssue[];
  readonly types: readonly string[];
}

export interface LoadError {
  readonly kind: 'error';
  readonly fileName: string;
  readonly message: string;
}

/**
 * Parses CSV text into everything the dashboard needs. The sample is shifted by whole
 * weeks so that it always falls inside the reporting window (plan.md §8.2); an uploaded
 * file always keeps its real dates.
 */
export function loadCsvText(
  text: string,
  fileName: string,
  isSample: boolean,
  today: CalendarDate,
): LoadedData | LoadError {
  const parsed = parseCsv(text);
  if (!parsed.ok) return { kind: 'error', fileName, message: parsed.message };

  const { issues, skipped, startedBeforeCreated } = toIssues(parsed.rows);
  const shiftDays = isSample ? sampleShiftDays(today) : 0;
  const finalIssues = shiftDays === 0 ? issues : shiftIssues(issues, shiftDays);
  return {
    kind: 'loaded',
    fileName,
    isSample,
    shiftDays,
    issues: finalIssues,
    skipped,
    startedBeforeCreated,
    types: issueTypes(finalIssues),
  };
}

/** Fetches the committed sample file that Vite serves from public/. */
export async function fetchSampleCsv(): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}sample-data/${SAMPLE_FILE_NAME}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}
