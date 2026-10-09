import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { AUTH_API_MESSAGES } from '../../src/api/auth-messages';
import { apiMessageSchema } from '../../src/api/schemas/auth-login.schema';
import { MALFORMED_AUTHORIZATION, tamperToken } from '../../src/data/auth-data';

// Spec 001 — Authentication. RF-24 to RF-26: the protected user endpoint
// `GET {API_BASE_URL}/user/get-cart-count/{userId}` accepts only the token issued by the login,
// sent as-is in `Authorization`. Tokens are never printed; assertion labels name the case only.

/** A refused call: HTTP 401 with the given message. */
function expectUnauthorized(result: ApiResult, message: string, label: string): void {
  expect(result.status, label).toBe(HTTP_STATUS.UNAUTHORIZED);
  expect(apiMessageSchema.parse(result.json).message, label).toBe(message);
}

test.describe('User authorization API — positive', () => {
  test(
    'TC-001-33 user endpoint answers 200 with the login token',
    { tag: ['@smoke', '@regression', '@api', '@critical'] },
    async ({ userClient, apiSession }) => {
      // Arrange: token and userId of account A from a real API login.
      const { token, userId } = apiSession;

      // Act
      const result = await userClient.getCartCount(userId, token);

      // Assert: the issued token grants access to the endpoint of its own customer (RF-24).
      expect(result.status).toBe(HTTP_STATUS.OK);
    },
  );
});

test.describe('User authorization API — security', () => {
  test('TC-001-34 user endpoint without Authorization answers 401', { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, apiSession }) => {
    // Arrange: a known userId, but no Authorization header at all.
    const { userId } = apiSession;

    // Act
    const result = await userClient.getCartCount(userId);

    // Assert: access is refused with the RF-25 message.
    expectUnauthorized(result, AUTH_API_MESSAGES.NO_TOKEN, 'no Authorization header');
  });

  test('TC-001-35 user endpoint with a tampered token answers 401', { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, apiSession }) => {
    // Arrange: a valid token whose last 4 characters are replaced, so its signature no longer
    // matches. The comparison is a boolean so a failure never prints the token.
    const { token, userId } = apiSession;
    const tampered = tamperToken(token);
    expect(tampered === token, 'the tampered token differs from the issued one').toBe(false);

    // Act
    const result = await userClient.getCartCount(userId, tampered);

    // Assert: a forged token is rejected with the RF-26 message.
    expectUnauthorized(result, AUTH_API_MESSAGES.SESSION_TIMEOUT, 'tampered token');
  });
});

test.describe('User authorization API — boundary', () => {
  test('TC-001-36 user endpoint with a malformed token answers 401', { tag: ['@regression', '@api'] }, async ({ userClient, apiSession }) => {
    // Arrange: headers that are not tokens. Observed on 2026-10-08: a non-token value is treated
    // like a bad token ("Session Timeout"), an empty value like a missing one.
    const { userId } = apiSession;
    const cases = [
      { label: 'non-token value', authorization: MALFORMED_AUTHORIZATION.NOT_A_TOKEN, message: AUTH_API_MESSAGES.SESSION_TIMEOUT },
      { label: 'empty value', authorization: MALFORMED_AUTHORIZATION.EMPTY, message: AUTH_API_MESSAGES.NO_TOKEN },
    ];

    // Act
    const results = await Promise.all(cases.map(async (item) => ({ item, result: await userClient.getCartCount(userId, item.authorization) })));

    // Assert: every malformed header is refused (RF-25, RF-26).
    for (const { item, result } of results) expectUnauthorized(result, item.message, item.label);
  });
});
