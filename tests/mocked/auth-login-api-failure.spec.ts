import { expect, test } from '../../src/fixtures/test';
import { AUTH_LOGIN_PATH, LOGIN_ROUTE_PATTERN } from '../../src/config/urls';
import { TEST_PASSWORD, UNKNOWN_EMAIL } from '../../src/data/auth-data';

// Spec 001 — Authentication. RF-11: when the login request of the form gets a 5xx answer or no
// answer, the customer stays on the login route without a session. Both states are hard to
// reproduce on the real site, so only the login API call is mocked with page.route(); the login
// page itself loads from the real site. Only TEST_ credentials are typed.

// The page lives under `/client/#/auth/login`; the hash is never part of a request URL, so this
// pattern matches only the API call `{API_BASE_URL}/auth/login`.
const LOGIN_API_PATTERN = `**/${AUTH_LOGIN_PATH}`;
/** 500 and 503: the lower edge of the 5xx partition and the usual "service unavailable". */
const SERVER_ERROR_STATUSES = [500, 503] as const;
const TEST_CREDENTIALS = { email: UNKNOWN_EMAIL, password: TEST_PASSWORD };

test.describe('Login form with a failing API — boundary', () => {
  test('TC-001-14 login API server error keeps the customer on the login page', { tag: ['@regression', '@mocked'] }, async ({ page, loginPage, navBar }) => {
    for (const status of SERVER_ERROR_STATUSES) {
      // Arrange: the login API answers this 5xx status; the page is reopened for each status.
      await page.unrouteAll();
      await page.route(LOGIN_API_PATTERN, (route) => route.fulfill({ status, body: 'TEST_server_error' }));
      await loginPage.open();
      const loginAnswer = page.waitForResponse((response) => response.url().endsWith(AUTH_LOGIN_PATH));

      // Act
      await loginPage.login(TEST_CREDENTIALS);
      const answer = await loginAnswer;

      // Assert: the mocked error really reached the app, and no session was created (RF-11, RF-9).
      expect(answer.status(), String(status)).toBe(status);
      await expect(page, String(status)).toHaveURL(LOGIN_ROUTE_PATTERN);
      await expect(loginPage.loginButton, String(status)).toBeVisible();
      await expect(navBar.signOutButton, String(status)).toBeHidden();
    }
  });
});

test.describe('Login form with a failing API — negative', () => {
  test('TC-001-15 login API without an answer keeps the customer on the login page', { tag: ['@regression', '@mocked'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: the login request fails at network level, as if the server never answered.
    await page.route(LOGIN_API_PATTERN, (route) => route.abort('failed'));
    await loginPage.open();
    const failedRequest = page.waitForEvent('requestfailed', (request) => request.url().endsWith(AUTH_LOGIN_PATH));

    // Act
    await loginPage.login(TEST_CREDENTIALS);
    await failedRequest;

    // Assert: after the failure the customer is still logged out on the login route (RF-11, RF-9).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(navBar.signOutButton).toBeHidden();
  });
});
