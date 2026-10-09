import { test } from '../../../../../src/fixtures/test';
import { withWrongPassword } from '../../../../../src/data/auth-data';

// Fixture for TC-001-41: a wrong password for account B, in a UI file. Never run: it is only read
// by the wrong-password check.
test('TEST_fixture wrong password for B', async ({ loginPage, accountB }) => {
  const credentials = withWrongPassword(accountB);
  await loginPage.open();
  await loginPage.emailInput.fill(credentials.email);
});
