import { describe, expect, it } from 'vitest';
import {
  loginApiUnreachableMessage,
  loginFailedStatusMessage,
  loginNoValidTokenMessage,
  loginPageUnavailableMessage,
  missingEnvVariableMessage,
} from '../../../src/errors/messages';
import { REDACTED, getSensitiveValues, redact } from '../../../src/security/redact';

// Spec 000 — Framework foundation. RF-20: the two passwords and any auth token are sensitive and
// are redacted from text. RF-21: emails are test identifiers, not secrets, but framework failure
// messages still never print them; they name the variable instead.
const EMAIL_A = 'TEST_a@example.test';
const EMAIL_B = 'TEST_b@example.test';
const PASSWORD_A = 'TEST_pass_a';
const PASSWORD_B = 'TEST_pass_b';
const TOKEN = 'TEST_token_123';
const ENV = {
  BASE_URL: 'https://TEST_host/client',
  API_BASE_URL: 'https://TEST_host/api',
  TEST_USER_EMAIL: EMAIL_A,
  TEST_USER_PASSWORD: PASSWORD_A,
  TEST_USER_2_EMAIL: EMAIL_B,
  TEST_USER_2_PASSWORD: PASSWORD_B,
};

describe('Sensitive values — security', () => {
  it('TC-000-33 passwords and auth token are redacted as sensitive values', () => {
    // Arrange: password B contains symbols, so its URL-encoded form (as in a query string or a
    // form body) differs from the plain one; the text holds password A and the token in plain
    // form and password B URL-encoded.
    const passwordWithSymbols = `${PASSWORD_B}@!`;
    const sensitive = getSensitiveValues({ ...ENV, TEST_USER_2_PASSWORD: passwordWithSymbols }, [TOKEN]);
    const text = `login ${PASSWORD_A} token=${TOKEN} second=${encodeURIComponent(passwordWithSymbols)}`;

    // Act
    const redacted = redact(text, sensitive);

    // Assert: no sensitive value survives, in plain or URL-encoded form.
    expect(redacted).toBe(`login ${REDACTED} token=${REDACTED} second=${REDACTED}`);
  });

  it('TC-000-34 emails are not classified as sensitive values', () => {
    // Arrange
    const text = `user ${EMAIL_A} logged in`;

    // Act
    const sensitive = getSensitiveValues(ENV, [TOKEN]);
    const redacted = redact(text, sensitive);

    // Assert: exactly the two passwords and the token; the email is a test identifier (RF-21).
    expect([...sensitive].sort()).toEqual([PASSWORD_A, PASSWORD_B, TOKEN].sort());
    expect(redacted).toBe(text);
  });

  it('TC-000-35 framework failure messages never contain email values', () => {
    // Arrange: every framework failure message, built while both emails are configured.
    const messages = [
      missingEnvVariableMessage('TEST_USER_EMAIL'),
      loginPageUnavailableMessage(`${ENV.BASE_URL}/#/auth/login`, 503),
      loginPageUnavailableMessage(`${ENV.BASE_URL}/#/auth/login`, 'timeout'),
      loginFailedStatusMessage(401),
      loginNoValidTokenMessage(200, 'text/html'),
      loginApiUnreachableMessage('ECONNREFUSED', ENV.API_BASE_URL),
    ];

    // Act
    const leaking = messages.filter((message) => message.includes(EMAIL_A) || message.includes(EMAIL_B));

    // Assert: no email is printed; the account is identified by its variable name (RF-55).
    expect(leaking).toEqual([]);
    expect(loginFailedStatusMessage(401)).toContain('TEST_USER_EMAIL');
    expect(loginFailedStatusMessage(401)).toContain('401');
  });
});
