import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { AUTH_API_MESSAGES } from '../../src/api/auth-messages';
import { apiMessageSchema } from '../../src/api/schemas/auth-login.schema';
import { MALFORMED_AUTHORIZATION, tamperToken } from '../../src/data/auth-data';
import { EMPTY_CRITERIA } from '../../src/data/catalog-oracle';

// Spec 002 — Catalog and search. RF-22 to RF-24: the product API answers only calls that carry the
// token issued by the login. Tokens are never printed: failures show the status and message only.

/** What a refusal is judged on: status, message and whether any product list came back. */
function outcomeOf(result: ApiResult): { status: number; message: string | undefined; hasProducts: boolean } {
  const parsed = apiMessageSchema.safeParse(result.json);
  const hasProducts = typeof result.json === 'object' && result.json !== null && 'data' in result.json;
  return { status: result.status, message: parsed.success ? parsed.data.message : undefined, hasProducts };
}

/** The expected refusal: HTTP 401, the given message and no product list. */
function refusal(message: string): ReturnType<typeof outcomeOf> {
  return { status: HTTP_STATUS.UNAUTHORIZED, message, hasProducts: false };
}

test.describe('Product API authorization — security', () => {
  test('TC-002-32 product API without Authorization answers 401', { tag: ['@regression', '@api', '@critical'] }, async ({ productClient }) => {
    // Arrange: no criteria and no Authorization header at all.
    const criteria = EMPTY_CRITERIA;

    // Act
    const result = await productClient.getAllProducts(criteria);

    // Assert: the catalog is not served without a session (RF-22).
    expect(outcomeOf(result)).toEqual(refusal(AUTH_API_MESSAGES.NO_TOKEN));
  });

  test('TC-002-33 product API with a tampered token answers 401', { tag: ['@regression', '@api', '@critical'] }, async ({ productClient, apiSession }) => {
    // Arrange: a valid token whose last 4 characters are replaced, so its signature no longer
    // matches. The comparison is a boolean so a failure never prints the token.
    const tampered = tamperToken(apiSession.token);
    expect(tampered === apiSession.token, 'the tampered token differs from the issued one').toBe(false);

    // Act
    const result = await productClient.getAllProducts(EMPTY_CRITERIA, tampered);

    // Assert: a forged token is refused (RF-23).
    expect(outcomeOf(result)).toEqual(refusal(AUTH_API_MESSAGES.SESSION_TIMEOUT));
  });

  test('TC-002-34 product API with a malformed token answers 401', { tag: ['@regression', '@api'] }, async ({ productClient }) => {
    // Arrange: an Authorization value that is not a token at all (Spec 001 test data).
    const malformed = MALFORMED_AUTHORIZATION.NOT_A_TOKEN;

    // Act
    const result = await productClient.getAllProducts(EMPTY_CRITERIA, malformed);

    // Assert: a malformed token is refused like a bad one (RF-24).
    expect(outcomeOf(result)).toEqual(refusal(AUTH_API_MESSAGES.SESSION_TIMEOUT));
  });
});
