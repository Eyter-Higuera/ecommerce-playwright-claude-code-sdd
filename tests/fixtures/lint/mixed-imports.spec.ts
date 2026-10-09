import { expect, test } from '@playwright/test';
import { vi } from 'vitest';

// Fixture for TC-000-47: mixes Playwright and Vitest imports in one file.
test('TEST_fixture mixes frameworks', async ({ page }) => {
  const spy = vi.fn();
  await page.setContent('<button>TEST_ok</button>');
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
  expect(typeof spy).toBe('function');
});
