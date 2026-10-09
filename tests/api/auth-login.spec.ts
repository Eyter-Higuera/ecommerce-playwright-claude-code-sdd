import { expect, test } from '../../src/fixtures/test';

// Spec 000 — Framework foundation. RF-54: API sanity test. It proves the framework can reach the
// shop's REST API and authenticate test account A. The token is checked but never logged or
// attached (RF-20, RF-26), and the `api` project records no trace (RF-25).
test.describe('Auth API sanity — positive', () => {
  test(
    'TC-000-80 API login with account A returns 200 and a token',
    { tag: ['@smoke', '@regression', '@api', '@critical'] },
    async ({ authClient, accountA }) => {
      // Arrange: account A credentials come from the environment through the fixture.

      // Act: login() throws RF-55/56/57's message on a non-200, an invalid token or no response.
      const token = await authClient.login(accountA);

      // Assert: a 200 with a non-empty string token was returned (checked against the zod
      // contract inside login()); only its shape is asserted here, never its value.
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    },
  );
});
