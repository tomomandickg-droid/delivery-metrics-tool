import { describe, expect, it } from 'vitest';
import { durationStats, median, percentile, round1 } from '../../src/domain/stats';

describe('percentile (PERCENTILE.INC, plan.md §6.4)', () => {
  it('worked example: [1, 2, 3, 4, 10] → median 3, 85th 6.4', () => {
    expect(median([1, 2, 3, 4, 10])).toBe(3);
    expect(percentile([1, 2, 3, 4, 10], 0.85)).toBeCloseTo(6.4, 10);
  });

  // Expected values follow the PERCENTILE.INC definition; each comment shows the working.
  it.each<[number[], number, number, string]>([
    [[15, 20, 35, 40, 50], 0.85, 44, 'h = 3.4 → 40 + 0.4 × 10'],
    [[1, 2, 3, 4], 0.5, 2.5, 'h = 1.5 → 2 + 0.5 × 1'],
    [[1, 2, 3, 4], 0.85, 3.55, 'h = 2.55 → 3 + 0.55 × 1'],
    [[3, 6, 7, 8, 8, 10, 13, 15, 16, 20], 0.5, 9, 'h = 4.5 → 8 + 0.5 × 2'],
    [[3, 6, 7, 8, 8, 10, 13, 15, 16, 20], 0.85, 15.65, 'h = 7.65 → 15 + 0.65 × 1'],
    [[1, 1, 1, 9], 0.85, 5.4, 'h = 2.55 → 1 + 0.55 × 8'],
    [[2, 4, 6, 8, 10, 12, 14], 0.85, 12.2, 'h = 5.1 → 12 + 0.1 × 2'],
  ])('%j at p=%d → %d (%s)', (values, p, expected) => {
    expect(percentile(values, p)).toBeCloseTo(expected, 10);
  });

  it('sorts the input itself and does not change it', () => {
    const values = [10, 1, 4, 3, 2];
    expect(median(values)).toBe(3);
    expect(values).toEqual([10, 1, 4, 3, 2]);
  });

  it('returns the only value when n = 1', () => {
    expect(median([7])).toBe(7);
    expect(percentile([7], 0.85)).toBe(7);
  });

  it('returns the mean of the two middle values for an even n', () => {
    expect(median([1, 2, 5, 9])).toBe(3.5);
  });

  it('handles ties', () => {
    expect(median([5, 5, 5, 5])).toBe(5);
    expect(percentile([5, 5, 5, 5], 0.85)).toBe(5);
  });

  it('returns min and max at p = 0 and p = 1', () => {
    expect(percentile([4, 1, 9], 0)).toBe(1);
    expect(percentile([4, 1, 9], 1)).toBe(9);
  });

  it('returns null when there are no values', () => {
    expect(percentile([], 0.85)).toBeNull();
    expect(median([])).toBeNull();
  });

  it.each([-0.1, 1.1, Number.NaN])('rejects p = %d', (p) => {
    expect(() => percentile([1, 2], p)).toThrow(RangeError);
  });
});

describe('durationStats', () => {
  it('returns n, sorted values, median and 85th percentile', () => {
    expect(durationStats([10, 1, 3, 2, 4])).toEqual({
      n: 5,
      values: [1, 2, 3, 4, 10],
      median: 3,
      p85: expect.closeTo(6.4, 10),
    });
  });

  it('returns nulls for no values', () => {
    expect(durationStats([])).toEqual({ n: 0, values: [], median: null, p85: null });
  });
});

describe('round1', () => {
  it.each([
    [6.3999999999999995, 6.4],
    [3.55, 3.6],
    [2.04, 2],
    [12, 12],
  ])('%d → %d', (value, expected) => {
    expect(round1(value)).toBe(expected);
  });
});
