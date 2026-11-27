import { describe, expect, it } from 'vitest';
import { binIndexOf, binLabel, histogram, MAX_BARS } from '../../src/domain/histogram';

describe('histogram (plan.md §6.6)', () => {
  it('uses one bar per day up to 30 days, including empty days', () => {
    const h = histogram([1, 5, 5, 6, 12, 18, 20]);
    expect(h.binWidth).toBe(1);
    expect(h.bins).toHaveLength(20);
    expect(h.bins[0]).toEqual({ from: 1, to: 1, count: 1 });
    expect(h.bins[4]).toEqual({ from: 5, to: 5, count: 2 });
    expect(h.bins[1]).toEqual({ from: 2, to: 2, count: 0 });
    expect(h.bins[19]).toEqual({ from: 20, to: 20, count: 1 });
  });

  it('still uses 1-day bars at exactly 30 days', () => {
    expect(histogram([30]).binWidth).toBe(1);
  });

  it.each([
    [31, 2, 16],
    [60, 2, 30],
    [61, 5, 13],
    [150, 5, 30],
    [151, 7, 22],
    [210, 7, 30],
  ])('longest %i days → %i-day bins, %i bars', (max, width, bars) => {
    const h = histogram([1, max]);
    expect(h.binWidth).toBe(width);
    expect(h.bins).toHaveLength(bars);
    expect(h.bins.length).toBeLessThanOrEqual(MAX_BARS);
  });

  it('beyond 210 days, widens the bins to keep 30 bars', () => {
    const h = histogram([1, 400]);
    expect(h.binWidth).toBe(14);
    expect(h.bins).toHaveLength(29);
  });

  it('puts each value in the right group and counts every value once', () => {
    const values = [1, 2, 3, 5, 6, 10, 11, 40];
    const h = histogram(values); // longest 40 days → 2-day bins: 1–2, 3–4, …, 39–40
    expect(h.binWidth).toBe(2);
    const total = h.bins.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(values.length);
    expect(h.bins[0]).toEqual({ from: 1, to: 2, count: 2 });
    expect(h.bins[1]).toEqual({ from: 3, to: 4, count: 1 });
    expect(h.bins[19]).toEqual({ from: 39, to: 40, count: 1 });
  });

  it('returns no bins for no values', () => {
    expect(histogram([])).toEqual({ binWidth: 1, bins: [] });
  });
});

describe('binIndexOf / binLabel', () => {
  const daily = histogram([1, 2, 3, 4, 10]);
  const grouped = histogram([1, 45]); // 2-day bins

  it('finds the bin of a whole or fractional value', () => {
    expect(binIndexOf(daily, 3)).toBe(2);
    expect(binIndexOf(daily, 6.4)).toBe(5);
    expect(binIndexOf(grouped, 4)).toBe(1); // 3–4
    expect(binIndexOf(grouped, 5)).toBe(2); // 5–6
  });

  it('clamps to the first and last bin', () => {
    expect(binIndexOf(daily, 0.5)).toBe(0);
    expect(binIndexOf(daily, 99)).toBe(daily.bins.length - 1);
  });

  it('labels 1-day and wider bins', () => {
    expect(binLabel(daily.bins[5]!)).toBe('6');
    expect(binLabel(grouped.bins[1]!)).toBe('3–4');
  });
});
