import { expect, test } from '@playwright/test';

// Fixture for TC-000-42: waits through a web-first assertion; must produce no lint error.
test('TEST_fixture waits for an element', async ({ page }) => {
  await page.setContent('<button>TEST_ok</button>');
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
});
