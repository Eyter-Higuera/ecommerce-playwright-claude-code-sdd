import { NO_TRACE, expect, test } from '../../../../../src/fixtures/test';

// Fixture for TC-001-37: a UI test that types the account A password from the real formAccountA
// fixture, on local content only (page.setContent, no network). It fails on its first attempt and
// passes on its first retry. `trace` is a worker option, so NO_TRACE is applied to the whole file.
test.use(NO_TRACE);

const PASSWORD_LABEL = 'TEST_password';
const PASSWORD_PAGE = `<label>${PASSWORD_LABEL} <input type="password"></label>`;

test('TEST_fixture password test fails once', async ({ page, formAccountA }) => {
  await page.setContent(PASSWORD_PAGE);
  await page.getByLabel(PASSWORD_LABEL).fill(formAccountA.password);
  await expect(page.getByLabel(PASSWORD_LABEL)).toHaveValue(formAccountA.password);
  expect(test.info().retry).toBeGreaterThan(0);
});
