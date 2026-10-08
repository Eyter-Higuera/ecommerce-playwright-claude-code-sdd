import { expect, test } from '@playwright/test';

// Fixture for TC-000-45: four Playwright promises without await, one per marked line.
test('TEST_fixture forgets to await', async ({ page, request }) => {
  const field = page.getByRole('textbox', { name: 'TEST_field' });
  page.click('text=TEST_ok'); // UNAWAITED
  field.fill('TEST_value'); // UNAWAITED
  request.get('http://localhost/TEST_api'); // UNAWAITED
  expect(field).toBeVisible(); // UNAWAITED
  await expect(field).toHaveValue('TEST_value');
});
