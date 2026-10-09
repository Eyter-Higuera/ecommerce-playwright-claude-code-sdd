import { expect, test } from '../../../../../src/fixtures/test';

// Fixture for TC-001-38: a UI test that holds no secret, on local content only. It fails on its
// first attempt and passes on its first retry, so Spec 000 RF-49 keeps a trace of the retry.
test('TEST_fixture normal test fails once', async ({ page }) => {
  await page.setContent('<button>TEST_ok</button>');
  await expect(page.getByRole('button', { name: 'TEST_ok' })).toBeVisible();
  expect(test.info().retry).toBeGreaterThan(0);
});
