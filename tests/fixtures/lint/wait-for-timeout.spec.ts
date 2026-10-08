import { expect, test } from '@playwright/test';

// Fixture for TC-000-43: a hard wait; must produce exactly one lint error.
test('TEST_fixture uses a hard wait', async ({ page }) => {
  await page.setContent('<button>TEST_ok</button>');
  await page.waitForTimeout(1000);
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
});
