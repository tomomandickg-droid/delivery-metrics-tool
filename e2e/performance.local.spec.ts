import { expect, test } from '@playwright/test';
import { generateSampleCsv } from '../scripts/sampleGenerator';

// Local only (`npm run test:perf`), not in CI: acceptance criterion 1,
// "all four metrics within 2 seconds for up to 5,000 issues" (plan.md §9).
const LIMIT_MS = 2000;
const CARDS = ['Throughput', 'Lead time', 'Cycle time', 'Work in progress'] as const;

test('5,000 issues: all four metric cards within 2 seconds of upload', async ({ page }) => {
  const csv = generateSampleCsv({ count: 5000 }); // 5,000 issues + 5 invalid rows
  await page.clock.setFixedTime(new Date(2026, 10, 27, 12, 0)); // so the window has data
  await page.goto('./');

  const start = Date.now();
  await page.getByLabel('CSV file').setInputFiles({
    name: 'jira-5000.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8'),
  });
  for (const title of CARDS) {
    await expect(page.getByRole('region', { name: title })).toBeVisible({ timeout: LIMIT_MS });
  }
  await expect(page.getByText('jira-5000.csv')).toBeVisible({ timeout: LIMIT_MS });
  const elapsed = Date.now() - start;

  console.log(`5,000 issues: four cards visible after ${elapsed} ms (limit ${LIMIT_MS} ms)`);
  await expect(page.getByRole('region', { name: 'Throughput' })).not.toContainText('No data');
  expect(elapsed).toBeLessThan(LIMIT_MS);
});
