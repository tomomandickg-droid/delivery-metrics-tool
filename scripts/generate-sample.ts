/**
 * Writes the sample Jira export.
 *
 *   npm run generate:sample                                  → public/sample-data/jira-sample.csv
 *   npm run generate:sample -- --count 5000 --out big.local.csv
 */
import { writeFileSync } from 'node:fs';
import { generateSampleCsv } from './sampleGenerator';

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const count = argValue('count');
const seed = argValue('seed');
const out = argValue('out') ?? 'public/sample-data/jira-sample.csv';

const csv = generateSampleCsv({
  ...(count !== undefined && { count: Number(count) }),
  ...(seed !== undefined && { seed: Number(seed) }),
});
writeFileSync(out, csv, 'utf8');

const rows = csv.trimEnd().split('\n').length - 1;
console.log(`Wrote ${rows} rows to ${out}`);
