/** At most about this many bars in the lead time distribution chart (plan.md §6.6). */
export const MAX_BARS = 30;

/** Bin widths in days, tried in order: 1 day, then 2-, 5- and 7-day groups. */
const WIDTHS = [1, 2, 5, 7] as const;

export interface HistogramBin {
  /** First day in the bin (inclusive). */
  readonly from: number;
  /** Last day in the bin (inclusive). */
  readonly to: number;
  readonly count: number;
}

export interface Histogram {
  readonly binWidth: number;
  /** From 1 day up to the bin holding the longest duration; empty bins included. */
  readonly bins: readonly HistogramBin[];
}

/**
 * Groups durations (whole days, ≥ 1) into bins for the distribution chart. One bar per day
 * while the longest value is at most 30 days; otherwise the smallest of 2, 5 or 7 days that
 * keeps it to 30 bars; beyond 210 days, whatever width gives 30 bars.
 */
export function histogram(values: readonly number[]): Histogram {
  if (values.length === 0) return { binWidth: 1, bins: [] };
  const max = values.reduce((m, v) => (v > m ? v : m), 1);
  const binWidth = WIDTHS.find((w) => Math.ceil(max / w) <= MAX_BARS) ?? Math.ceil(max / MAX_BARS);
  const counts = new Array<number>(Math.ceil(max / binWidth)).fill(0);
  for (const v of values) {
    const i = Math.floor((v - 1) / binWidth);
    counts[i] = (counts[i] as number) + 1;
  }
  return {
    binWidth,
    bins: counts.map((count, i) => ({ from: i * binWidth + 1, to: (i + 1) * binWidth, count })),
  };
}

/**
 * The bin a value (e.g. a median of 6.5) falls in, for placing a marker line.
 * Clamped to the first and last bin.
 */
export function binIndexOf(h: Histogram, value: number): number {
  const i = Math.floor((value - 1) / h.binWidth);
  return Math.min(Math.max(i, 0), h.bins.length - 1);
}

/** "6" for a 1-day bin, "1–5" for a wider one. */
export function binLabel(bin: HistogramBin): string {
  return bin.from === bin.to ? String(bin.from) : `${bin.from}–${bin.to}`;
}
