import { fromYmd } from '../../src/domain/dates';
import type { CalendarDate, Issue } from '../../src/domain/types';

/** d('2026-11-27') → CalendarDate. Throws on a typo so tests fail loudly. */
export function d(iso: string): CalendarDate {
  const [y, m, day] = iso.split('-').map(Number);
  const date = fromYmd(y as number, m as number, day as number);
  if (date === null) throw new Error(`Bad test date: ${iso}`);
  return date;
}

/** Builds an Issue from ISO date strings; omitted dates stay absent. */
export function issue(
  key: string,
  fields: { type?: string; status?: string; created: string; resolved?: string; started?: string },
): Issue {
  return {
    key,
    type: fields.type ?? 'Story',
    status: fields.status ?? 'Done',
    created: d(fields.created),
    ...(fields.resolved !== undefined && { resolved: d(fields.resolved) }),
    ...(fields.started !== undefined && { started: d(fields.started) }),
  };
}
