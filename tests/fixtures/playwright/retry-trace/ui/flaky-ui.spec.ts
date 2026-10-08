import { expect, test } from '@playwright/test';

// Fixture for TC-000-41: UI tests on local content only (page.setContent, no network).
test('TEST_fixture ui fails once', async ({ page }) => {
  await page.setContent('<button>TEST_ok</button>');
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
  expect(test.info().retry).toBeGreaterThan(0);
});

test('TEST_fixture ui passes first time', async ({ page }) => {
  await page.setContent('<button>TEST_ok</button>');
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
});
