import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { AUTH_API_MESSAGES } from '../../src/api/auth-messages';
import { apiMessageSchema } from '../../src/api/schemas/auth-login.schema';
import { MALFORMED_AUTHORIZATION, tamperToken } from '../../src/data/auth-data';
import { anyProduct } from '../../src/data/catalog-data';

// Spec 003 — Product detail. RF-15 to RF-17: the product detail API answers only calls that carry
// the token issued by the login. The product id comes from the catalog, read with a valid token.
// Tokens are never printed: failures show the status and message only.

/** What a refusal is judged on: status, message and whether any product data came back. */
function outcomeOf(result: ApiResult): { status: number; message: string | undefined; hasData: boolean } {
  const parsed = apiMessageSchema.safeParse(result.json);
  const hasData = typeof result.json === 'object' && result.json !== null && 'data' in result.json;
  return { status: result.status, message: parsed.success ? parsed.data.message : undefined, hasData };
}

/** The expected refusal: HTTP 401, the given message and no product data. */
function refusal(message: string): ReturnType<typeof outcomeOf> {
  return { status: HTTP_STATUS.UNAUTHORIZED, message, hasData: false };
}

test.describe('Product detail API authorization — security', () => {
  test('TC-003-17 product detail API without Authorization answers 401', { tag: ['@regression', '@api', '@critical'] }, async ({ productClient, catalog }) => {
    // Arrange: a real product id, and no Authorization header on the detail call.
    const id = anyProduct(catalog)._id;

    // Act
    const result = await productClient.getProductDetail(id);

    // Assert: the detail is not served without a session (RF-15).
    expect(outcomeOf(result)).toEqual(refusal(AUTH_API_MESSAGES.NO_TOKEN));
  });

  test('TC-003-18 product detail API with a tampered token answers 401', { tag: ['@regression', '@api', '@critical'] }, async ({ productClient, apiSession, catalog }) => {
    // Arrange: a valid token whose last 4 characters are replaced. The comparison is a boolean so a
    // failure never prints the token.
    const tampered = tamperToken(apiSession.token);
    expect(tampered === apiSession.token, 'the tampered token differs from the issued one').toBe(false);

    // Act
    const result = await productClient.getProductDetail(anyProduct(catalog)._id, tampered);

    // Assert: a forged token is refused (RF-16).
    expect(outcomeOf(result)).toEqual(refusal(AUTH_API_MESSAGES.SESSION_TIMEOUT));
  });

  test('TC-003-19 product detail API with a malformed token answers 401', { tag: ['@regression', '@api'] }, async ({ productClient, catalog }) => {
    // Arrange: an Authorization value that is not a token at all (Spec 001 test data).
    const malformed = MALFORMED_AUTHORIZATION.NOT_A_TOKEN;

    // Act
    const result = await productClient.getProductDetail(anyProduct(catalog)._id, malformed);

    // Assert: a malformed token is refused like a bad one (RF-17).
    expect(outcomeOf(result)).toEqual(refusal(AUTH_API_MESSAGES.SESSION_TIMEOUT));
  });
});
