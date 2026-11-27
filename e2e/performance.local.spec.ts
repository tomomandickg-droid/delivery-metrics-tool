import { expect, test } from '@playwright/test';

// Placeholder: task 22 replaces this with the 5,000-issue timing check. Local only.
test('app loads (perf placeholder)', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Delivery Metrics' })).toBeVisible();
});
