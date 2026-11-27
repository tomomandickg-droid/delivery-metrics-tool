import type { DurationStats } from './types';

/**
 * Percentile with linear interpolation between closest ranks: the same method as
 * Excel PERCENTILE.INC and Google Sheets PERCENTILE (plan.md §6.4).
 *
 *   h = (n - 1) * p;  result = x[⌊h⌋] + (h - ⌊h⌋) * (x[⌈h⌉] - x[⌊h⌋])
 *
 * Returns null for an empty list. `p` must be between 0 and 1.
 */
export function percentile(values: readonly number[], p: number): number | null {
  if (!(p >= 0 && p <= 1)) throw new RangeError(`Percentile must be between 0 and 1, got ${p}`);
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const h = (sorted.length - 1) * p;
  const lower = sorted[Math.floor(h)] as number;
  const upper = sorted[Math.ceil(h)] as number;
  return lower + (h - Math.floor(h)) * (upper - lower);
}

/** Same as Excel MEDIAN: the middle value, or the mean of the two middle values. */
export function median(values: readonly number[]): number | null {
  return percentile(values, 0.5);
}

/** n, sorted values, median and 85th percentile of a list of durations. */
export function durationStats(values: readonly number[]): DurationStats {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    values: sorted,
    median: median(sorted),
    p85: percentile(sorted, 0.85),
  };
}

/** Rounds to one decimal place for display (6.3999… → 6.4). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
