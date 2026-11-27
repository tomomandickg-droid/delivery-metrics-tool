import type { Issue } from './types';

/** Distinct Issue Type values, sorted alphabetically (case-insensitive). */
export function issueTypes(issues: readonly Issue[]): string[] {
  return [...new Set(issues.map((i) => i.type))].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );
}

/** Issues whose type is one of the selected types. An empty selection gives no issues. */
export function filterByTypes(
  issues: readonly Issue[],
  selectedTypes: ReadonlySet<string>,
): readonly Issue[] {
  return issues.filter((i) => selectedTypes.has(i.type));
}
