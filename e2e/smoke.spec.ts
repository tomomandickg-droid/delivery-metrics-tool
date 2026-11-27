import { expect, test } from '@playwright/test';

const CARDS = ['Throughput', 'Lead time', 'Cycle time', 'Work in progress'] as const;

// Runs in CI (spec: quality gates). The clock is fixed to the sample's export date,
// Fri 27 Nov 2026, so the result never depends on the day the test runs.
test('loading the sample shows the four metric cards', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 27, 12, 0));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Delivery Metrics' })).toBeVisible();

  await page.getByRole('button', { name: 'Load sample data' }).click();

  for (const title of CARDS) {
    await expect(page.getByRole('region', { name: title })).toBeVisible();
  }
  // Same values as the component tests: the sample at its own export date.
  await expect(page.getByRole('region', { name: 'Throughput' })).toContainText('12.6per week');
  await expect(page.getByRole('region', { name: 'Work in progress' })).toContainText('7issues');
  await expect(page.getByRole('figure', { name: /Throughput per week/ })).toBeVisible();
  await expect(page.getByRole('figure', { name: /Lead time distribution/ })).toBeVisible();
});
