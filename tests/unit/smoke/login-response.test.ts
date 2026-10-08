import { describe, expect, it, vi } from 'vitest';
import { AuthClient, type LoginRequestContext } from '../../../src/api/auth-client';
import type { LoginHttpResponse } from '../../../src/api/login-response';
import { API_TIMEOUT_MS } from '../../../src/config/timeouts';

// Spec 000 — Framework foundation. RF-54 to RF-57: the API sanity test must fail with a precise,
// value-free message for each way the login can go wrong (wrong status, no valid token, no
// response). The HTTP layer is a stub: unit tests never reach the network.
const API_BASE_URL = 'https://TEST_host/api';
const CREDENTIALS = { email: 'TEST_a@example.test', password: 'TEST_pass_a' };
const HTTP_OK = 200;
const JSON_TYPE = 'application/json';
const SPEC_API_BUDGET_MS = 30_000;

function stubResponse(status: number, contentType: string, body: string): LoginHttpResponse {
  return {
    status: () => status,
    headers: () => ({ 'content-type': contentType }),
    text: () => Promise.resolve(body),
  };
}

function clientReturning(response: LoginHttpResponse) {
  const post = vi.fn<LoginRequestContext['post']>().mockResolvedValue(response);
  return { client: new AuthClient({ post }, API_BASE_URL), post };
}

function clientFailingWith(error: Error) {
  const post = vi.fn<LoginRequestContext['post']>().mockRejectedValue(error);
  return new AuthClient({ post }, API_BASE_URL);
}

describe('Login response — negative', () => {
  it('TC-000-81 non-200 login response names the variable, not its value', async () => {
    // Arrange: an unauthorized, a rate-limited and a server-error answer.
    const statuses = [401, 429, 500];

    // Act
    const messages = await Promise.all(
      statuses.map(async (status) => {
        const { client } = clientReturning(stubResponse(status, JSON_TYPE, '{"message":"TEST_error"}'));
        return client.login(CREDENTIALS).then(() => 'no error', (error: Error) => error.message);
      }),
    );

    // Assert: each message shows the status and names TEST_USER_EMAIL, never the email itself.
    statuses.forEach((status, index) => {
      expect(messages[index]).toContain(String(status));
      expect(messages[index]).toContain('TEST_USER_EMAIL');
      expect(messages[index]).not.toContain(CREDENTIALS.email);
    });
  });

  it('TC-000-82 non-JSON login response fails with the no-valid-token message', async () => {
    // Arrange: a 200 that is an HTML maintenance page, with a charset parameter in the header.
    const { client } = clientReturning(stubResponse(HTTP_OK, 'text/html; charset=utf-8', '<html>TEST_maintenance</html>'));

    // Act
    const login = client.login(CREDENTIALS);

    // Assert
    await expect(login).rejects.toThrow('Login response has no valid token (status 200, content-type text/html)');
  });

  it('TC-000-84 unreachable login API fails with the error type and URL', async () => {
    // Arrange: the three ways a request can get no HTTP response, as Playwright reports them.
    const failures = [
      { error: new Error('connect ECONNREFUSED 127.0.0.1:443'), type: 'ECONNREFUSED' },
      { error: new Error('getaddrinfo ENOTFOUND TEST_host'), type: 'ENOTFOUND' },
      { error: new Error(`Request timed out after ${String(API_TIMEOUT_MS)}ms`), type: 'timeout' },
    ];

    // Act
    const messages = await Promise.all(
      failures.map(({ error }) => clientFailingWith(error).login(CREDENTIALS).then(() => 'no error', (e: Error) => e.message)),
    );

    // Assert: each failure is classified and names the API base URL.
    expect(messages).toEqual(failures.map(({ type }) => `Login API unreachable: ${type} (${API_BASE_URL})`));
  });
});

describe('Login response — boundary', () => {
  it('TC-000-83 empty, null, missing or non-string token fails', async () => {
    // Arrange: the token partitions just outside "non-empty string".
    const bodies = ['{"token":""}', '{"token":null}', '{}', '{"token":123}'];

    // Act
    const messages = await Promise.all(
      bodies.map((body) => clientReturning(stubResponse(HTTP_OK, JSON_TYPE, body)).client.login(CREDENTIALS).then(() => 'no error', (e: Error) => e.message)),
    );

    // Assert
    expect(messages).toEqual(bodies.map(() => 'Login response has no valid token (status 200, content-type application/json)'));
  });

  it('TC-000-85 API request budget is 30 seconds', async () => {
    // Arrange: a valid answer, so the call completes and its options can be inspected.
    const { client, post } = clientReturning(stubResponse(HTTP_OK, JSON_TYPE, '{"token":"TEST_token"}'));

    // Act
    await client.login(CREDENTIALS);

    // Assert: the constant matches the spec and is the timeout actually sent with the request.
    expect(API_TIMEOUT_MS).toBe(SPEC_API_BUDGET_MS);
    expect(post).toHaveBeenCalledWith(`${API_BASE_URL}/auth/login`, {
      data: { userEmail: CREDENTIALS.email, userPassword: CREDENTIALS.password },
      timeout: SPEC_API_BUDGET_MS,
    });
  });
});
