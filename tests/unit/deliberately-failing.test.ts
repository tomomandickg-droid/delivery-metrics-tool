import { expect, it } from 'vitest';

// Deliberately failing: verifies that branch protection blocks merging a red PR (task 4).
it('fails on purpose', () => {
  expect(1 + 1).toBe(3);
});
