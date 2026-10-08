import { expect, test } from '@playwright/test';

// Fixture for TC-000-44: every Playwright promise is awaited; must produce no lint error.
test('TEST_fixture awaits every call', async ({ page, request }) => {
  await page.goto('http://localhost/TEST_page');
  await page.getByRole('button', { name: 'TEST_ok' }).click();
  const response = await request.get('http://localhost/TEST_api');
  expect(response.ok()).toBe(true);
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
});
