import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { AUTH_API_MESSAGES } from '../../src/api/auth-messages';
import { toLoginBody } from '../../src/api/auth-client';
import { apiMessageSchema, authLoginSuccessSchema } from '../../src/api/schemas/auth-login.schema';
import {
  INJECTION_INPUTS,
  MAX_FIELD_LENGTH,
  TEST_PASSWORD,
  UNKNOWN_EMAIL,
  emailOfLength,
  untrimmed,
  upperCased,
  valueOfLength,
  withWrongPassword,
} from '../../src/data/auth-data';

// Spec 001 — Authentication. RF-13 to RF-19: the login endpoint `POST {API_BASE_URL}/auth/login`.
// The `api` project records no trace, and tokens are checked by shape only, never printed.

/** A rejected login: the expected status and message, and no token in the body. */
function expectRejected(result: ApiResult, status: number, message: string, label: string): void {
  expect(result.status, label).toBe(status);
  expect(apiMessageSchema.parse(result.json).message, label).toBe(message);
  expect(result.json, label).not.toHaveProperty('token');
}

/** RF-17 / RF-18: a client error (400-499, never a 5xx) and no token. */
function expectClientError(result: ApiResult, label: string): void {
  expect(result.status, label).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
  expect(result.status, label).toBeLessThan(HTTP_STATUS.FIRST_SERVER_ERROR);
  expect(result.json, label).not.toHaveProperty('token');
}
test.describe('Auth login API — positive', () => {
  test(
    'TC-001-17 API login with account A returns token, userId and message',
    { tag: ['@regression', '@api', '@critical'] },
    async ({ authClient, accountA }) => {
      // Arrange: account A credentials come from the environment through the fixture.
      const body = toLoginBody(accountA);

      // Act
      const result = await authClient.postLogin(body);

      // Assert: HTTP 200 and the RF-13 contract (non-empty string token and userId), then the
      // success message by value.
      expect(result.status).toBe(HTTP_STATUS.OK);
      const login = authLoginSuccessSchema.parse(result.json);
      expect(login.token.length).toBeGreaterThan(0);
      expect(login.userId.length).toBeGreaterThan(0);
      expect(login.message).toBe(AUTH_API_MESSAGES.LOGIN_SUCCESS);
    },
  );

  test(
    'TC-001-18 API login with account B returns token, userId and message',
    { tag: ['@regression', '@api'] },
    async ({ authClient, accountB }) => {
      // Arrange: account B is used for successful logins only (spec clarification 6).
      const body = toLoginBody(accountB);

      // Act
      const result = await authClient.postLogin(body);

      // Assert: the same RF-13 contract holds for the second account.
      expect(result.status).toBe(HTTP_STATUS.OK);
      const login = authLoginSuccessSchema.parse(result.json);
      expect(login.token.length).toBeGreaterThan(0);
      expect(login.userId.length).toBeGreaterThan(0);
      expect(login.message).toBe(AUTH_API_MESSAGES.LOGIN_SUCCESS);
    },
  );
});

test.describe('Auth login API — negative', () => {
  test('TC-001-20 API login with an unknown account is rejected', { tag: ['@regression', '@api'] }, async ({ authClient }) => {
    // Arrange: a well-formed email of no registered account, so no real account is touched.
    const body = { userEmail: UNKNOWN_EMAIL, userPassword: TEST_PASSWORD };

    // Act
    const result = await authClient.postLogin(body);

    // Assert: the generic credentials error, without revealing whether the email exists (RF-14).
    expectRejected(result, HTTP_STATUS.BAD_REQUEST, AUTH_API_MESSAGES.INCORRECT_CREDENTIALS, 'unknown account');
  });

  test('TC-001-21 API login without userPassword is rejected', { tag: ['@regression', '@api'] }, async ({ authClient }) => {
    // Arrange: the password field is absent from the body.
    const body = { userEmail: UNKNOWN_EMAIL };

    // Act
    const result = await authClient.postLogin(body);

    // Assert: RF-15's required-field message and no token.
    expectRejected(result, HTTP_STATUS.BAD_REQUEST, AUTH_API_MESSAGES.PASSWORD_REQUIRED, 'no userPassword');
  });

  test('TC-001-22 API login without userEmail is rejected', { tag: ['@regression', '@api'] }, async ({ authClient }) => {
    // Arrange: the email field is absent from the body.
    const body = { userPassword: TEST_PASSWORD };

    // Act
    const result = await authClient.postLogin(body);

    // Assert: RF-16's required-field message and no token.
    expectRejected(result, HTTP_STATUS.BAD_REQUEST, AUTH_API_MESSAGES.EMAIL_REQUIRED, 'no userEmail');
  });
});

test.describe('Auth login API — boundary', () => {
  test('TC-001-23 API login with empty-string fields is rejected', { tag: ['@regression', '@api'] }, async ({ authClient }) => {
    // Arrange: each field present but empty, the boundary between "absent" and "filled".
    const cases = [
      { label: 'empty userEmail', body: { userEmail: '', userPassword: TEST_PASSWORD }, message: AUTH_API_MESSAGES.EMAIL_REQUIRED },
      { label: 'empty userPassword', body: { userEmail: UNKNOWN_EMAIL, userPassword: '' }, message: AUTH_API_MESSAGES.PASSWORD_REQUIRED },
    ];

    // Act
    const results = await Promise.all(cases.map(async (item) => ({ item, result: await authClient.postLogin(item.body) })));

    // Assert: an empty field is treated like a missing one (RF-15, RF-16).
    for (const { item, result } of results) expectRejected(result, HTTP_STATUS.BAD_REQUEST, item.message, item.label);
  });
});

test.describe('Auth login API — boundary (length and email form)', () => {
  test('TC-001-25 API login with over-long values returns 4xx and no token', { tag: ['@regression', '@api'] }, async ({ authClient }) => {
    // Arrange: the 255-character lower boundary and values just and far above it, in each field.
    const justAbove = MAX_FIELD_LENGTH + 1;
    const farAbove = 1_000;
    const cases = [
      { label: `email of ${String(MAX_FIELD_LENGTH)}`, body: { userEmail: emailOfLength(MAX_FIELD_LENGTH), userPassword: TEST_PASSWORD } },
      { label: `email of ${String(justAbove)}`, body: { userEmail: emailOfLength(justAbove), userPassword: TEST_PASSWORD } },
      { label: `email of ${String(farAbove)}`, body: { userEmail: emailOfLength(farAbove), userPassword: TEST_PASSWORD } },
      { label: `password of ${String(MAX_FIELD_LENGTH)}`, body: { userEmail: UNKNOWN_EMAIL, userPassword: valueOfLength(MAX_FIELD_LENGTH) } },
      { label: `password of ${String(justAbove)}`, body: { userEmail: UNKNOWN_EMAIL, userPassword: valueOfLength(justAbove) } },
    ];

    // Act
    const results = await Promise.all(cases.map(async (item) => ({ item, result: await authClient.postLogin(item.body) })));

    // Assert: every length is rejected as a client error, never crashing the server (RF-18).
    for (const { item, result } of results) expectClientError(result, item.label);
  });

  test('TC-001-26 API login with an untrimmed or differently cased email is rejected', { tag: ['@regression', '@api'] }, async ({ authClient, accountA }) => {
    // Arrange: account A's correct password with its email in two non-exact forms. The upper-case
    // form must really differ from the stored email, or the case would prove nothing.
    const forms = [
      { label: 'untrimmed email', email: untrimmed(accountA.email) },
      { label: 'upper-case email', email: upperCased(accountA.email) },
    ];
    for (const form of forms) expect(form.email, form.label).not.toBe(accountA.email);

    // Act
    const results = await Promise.all(
      forms.map(async (form) => ({ form, result: await authClient.postLogin({ userEmail: form.email, userPassword: accountA.password }) })),
    );

    // Assert: emails are neither trimmed nor case-insensitive (RF-19, observed behavior).
    for (const { form, result } of results) expectRejected(result, HTTP_STATUS.BAD_REQUEST, AUTH_API_MESSAGES.INCORRECT_CREDENTIALS, form.label);
  });
});

test.describe('Auth login API — security', () => {
  test('TC-001-24 API login with injection-style input returns 4xx and no token', { tag: ['@regression', '@api', '@critical'] }, async ({ authClient }) => {
    // Arrange: each injection-style value in the email field, then in the password field.
    const cases = INJECTION_INPUTS.flatMap((input) => [
      { label: `userEmail ${input}`, body: { userEmail: input, userPassword: TEST_PASSWORD } },
      { label: `userPassword ${input}`, body: { userEmail: UNKNOWN_EMAIL, userPassword: input } },
    ]);

    // Act
    const results = await Promise.all(cases.map(async (item) => ({ item, result: await authClient.postLogin(item.body) })));

    // Assert: no value logs anyone in or makes the server fail (RF-17).
    for (const { item, result } of results) expectClientError(result, item.label);
  });
});

test.describe('Auth login API — wrong password for a real account', () => {
  // RF-28: the only login with a wrong password for a real account (account A) in the whole run.
  // It must not be retried, so it never counts twice towards a lockout of the shared account.
  test.describe.configure({ retries: 0 });

  test(
    'TC-001-19 API login with a wrong password for account A is rejected',
    { tag: ['@regression', '@api', '@critical'] },
    async ({ authClient, accountA }) => {
      // Arrange: account A's real email with a TEST_ password that is certainly wrong.
      const body = toLoginBody(withWrongPassword(accountA));

      // Act
      const result = await authClient.postLogin(body);

      // Assert: the same generic error as for an unknown account, so the API does not reveal
      // that the email is registered (RF-14), and no token.
      expectRejected(result, HTTP_STATUS.BAD_REQUEST, AUTH_API_MESSAGES.INCORRECT_CREDENTIALS, 'wrong password');
    },
  );
});
