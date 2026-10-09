import { test } from '../../../../../src/fixtures/test';
import { toLoginBody } from '../../../../../src/api/auth-client';
import { withWrongPassword } from '../../../../../src/data/auth-data';

// Fixture for TC-001-41: two wrong-password tests for account A; the second one is also retried.
// Never run: it is only read by the wrong-password check.
test.describe('TEST_fixture limited', () => {
  test.describe.configure({ retries: 0 });

  test('TEST_fixture first wrong password for A', async ({ authClient, accountA }) => {
    await authClient.postLogin(toLoginBody(withWrongPassword(accountA)));
  });
});

test.describe('TEST_fixture retried', () => {
  test('TEST_fixture second wrong password for A', async ({ authClient, accountA }) => {
    await authClient.postLogin(toLoginBody(withWrongPassword(accountA)));
  });
});
