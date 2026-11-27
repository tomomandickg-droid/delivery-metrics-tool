import { describe, expect, it, vi } from 'vitest';

// Papa Parse normally gives a row with every quote error. This covers the fallback
// message for an error without one, which real files have not produced so far.
vi.mock('papaparse', () => ({
  default: {
    parse: () => ({
      data: [],
      errors: [
        {
          type: 'Quotes',
          code: 'InvalidQuotes',
          message: 'Trailing quote on quoted field is malformed',
        },
      ],
      meta: {},
    }),
  },
}));

const { parseCsv } = await import('../../src/domain/parseCsv');

describe('parseCsv: quote error without a row number', () => {
  it('reports invalid CSV without naming a row', () => {
    expect(parseCsv('anything')).toEqual({
      ok: false,
      error: { kind: 'invalid-csv', detail: 'Trailing quote on quoted field is malformed' },
      message: 'The file is not valid CSV: Trailing quote on quoted field is malformed.',
    });
  });
});
