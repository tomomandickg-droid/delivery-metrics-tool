export const REQUIRED_COLUMNS = [
  'Issue key',
  'Issue Type',
  'Status',
  'Created',
  'Resolved',
  'Started',
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

export type ColumnIndexes = Readonly<Record<RequiredColumn, number>>;

/**
 * Header names accepted for each column, already normalised.
 * Jira exports a custom field as "Custom field (<name>)".
 */
const ACCEPTED_HEADERS: Readonly<Record<RequiredColumn, readonly string[]>> = {
  'Issue key': ['issue key'],
  'Issue Type': ['issue type'],
  Status: ['status'],
  Created: ['created'],
  Resolved: ['resolved'],
  Started: ['started', 'custom field (started)'],
};

/** Removes a byte-order mark, trims, collapses inner spaces and ignores case. */
export function normalizeHeader(header: string): string {
  return header.replace(/^﻿/, '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export type ColumnMatch =
  | { readonly ok: true; readonly indexes: ColumnIndexes }
  | { readonly ok: false; readonly missing: readonly RequiredColumn[] };

/**
 * Finds each required column in the header row. If a header appears more than once,
 * the first one is used. Every missing column is reported, in the order of REQUIRED_COLUMNS.
 */
export function matchColumns(headers: readonly string[]): ColumnMatch {
  const normalized = headers.map(normalizeHeader);
  const indexes: Partial<Record<RequiredColumn, number>> = {};
  const missing: RequiredColumn[] = [];

  for (const column of REQUIRED_COLUMNS) {
    const accepted = ACCEPTED_HEADERS[column];
    const index = normalized.findIndex((h) => accepted.includes(h));
    if (index === -1) missing.push(column);
    else indexes[column] = index;
  }

  return missing.length > 0 ? { ok: false, missing } : { ok: true, indexes: indexes as ColumnIndexes };
}

/** `Missing required column: "Started"` or `Missing required columns: "Resolved", "Started"` */
export function missingColumnsMessage(missing: readonly RequiredColumn[]): string {
  const names = missing.map((c) => `"${c}"`).join(', ');
  return missing.length === 1
    ? `Missing required column: ${names}`
    : `Missing required columns: ${names}`;
}
