import { expect, test } from '@playwright/test';

// Fixture for TC-000-46: a Playwright test file importing only @playwright/test.
test('TEST_fixture uses Playwright only', async ({ page }) => {
  await page.setContent('<button>TEST_ok</button>');
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
});
