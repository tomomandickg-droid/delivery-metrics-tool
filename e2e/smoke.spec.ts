import { expect, test } from '@playwright/test';

// Placeholder: task 22 replaces this with "load the sample, see four metric cards".
test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Delivery Metrics' })).toBeVisible();
});
