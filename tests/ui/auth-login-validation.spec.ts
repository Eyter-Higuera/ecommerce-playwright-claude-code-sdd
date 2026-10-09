import { expect, test } from '../../src/fixtures/test';
import { LOGIN_ROUTE_PATTERN } from '../../src/config/urls';
import { API_TIMEOUT_MS } from '../../src/config/timeouts';
import { INJECTION_INPUTS, INVALID_EMAILS, TEST_PASSWORD, UNKNOWN_EMAIL } from '../../src/data/auth-data';

// Spec 001 — Authentication. UI login without a session: guests, client-side validation, rejected
// credentials and input handling (RF-3 to RF-10, RF-12, RF-20, RF-23). No test here types a real
// password or holds a token, so these tests keep the Spec 000 trace on first retry.

const PASSWORD_INPUT_TYPE = 'password';
const EMPTY = '';

test.describe('Login UI — negative (validation)', () => {
  test('TC-001-06 empty email shows the email-required message', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: an empty email and a TEST_ password.
    await loginPage.open();

    // Act
    await loginPage.login({ email: EMPTY, password: TEST_PASSWORD });

    // Assert: only the email message fires (RF-4, RF-5 negative side) and the login is rejected (RF-9).
    await expect(loginPage.emailRequiredMessage).toBeVisible();
    await expect(loginPage.passwordRequiredMessage).toBeHidden();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(navBar.signOutButton).toBeHidden();
  });

  test('TC-001-07 empty password shows the password-required message', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: a well-formed TEST_ email and an empty password.
    await loginPage.open();

    // Act
    await loginPage.login({ email: UNKNOWN_EMAIL, password: EMPTY });

    // Assert: only the password message fires (RF-5, RF-4 negative side) and the login is rejected (RF-9).
    await expect(loginPage.passwordRequiredMessage).toBeVisible();
    await expect(loginPage.emailRequiredMessage).toBeHidden();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(navBar.signOutButton).toBeHidden();
  });

  test('TC-001-09 invalid email formats show the valid-email message', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: three malformed emails (no "@", nothing after "@", nothing before "@"), each
    // submitted from a freshly opened page so no value influences the next.
    for (const email of INVALID_EMAILS) {
      await loginPage.open();

      // Act
      await loginPage.login({ email, password: TEST_PASSWORD });

      // Assert: the email is rejected on the client (RF-6) and no session exists (RF-9).
      await expect(loginPage.validEmailMessage, email).toBeVisible();
      await expect(page, email).toHaveURL(LOGIN_ROUTE_PATTERN);
      await expect(navBar.signOutButton, email).toBeHidden();
    }
  });

  test('TC-001-13 email field shows typed characters', { tag: ['@regression', '@ui'] }, async ({ loginPage }) => {
    // Arrange
    await loginPage.open();

    // Act
    await loginPage.emailInput.fill(UNKNOWN_EMAIL);

    // Assert: only the password is masked; the email is a plain field showing its value (RF-10
    // negative side).
    await expect(loginPage.emailInput).not.toHaveAttribute('type', PASSWORD_INPUT_TYPE);
    await expect(loginPage.emailInput).toHaveValue(UNKNOWN_EMAIL);
  });
});

test.describe('Login UI — negative (credentials)', () => {
  test('TC-001-10 unknown account shows the incorrect-credentials alert', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: a well-formed email of no registered account, so no real account is touched.
    await loginPage.open();
    const dialogs = loginPage.recordDialogs();

    // Act
    await loginPage.login({ email: UNKNOWN_EMAIL, password: TEST_PASSWORD });

    // Assert: the server-side rejection is announced as an alert within the 30 s budget (RF-7);
    // the email passed client validation (RF-6 negative side); nothing ran in a dialog (RF-8
    // negative side); the customer stays logged out on the login route (RF-1, RF-2, RF-9).
    await expect(loginPage.incorrectCredentialsAlert).toBeVisible({ timeout: API_TIMEOUT_MS });
    await expect(loginPage.validEmailMessage).toBeHidden();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(navBar.signOutButton).toBeHidden();
    expect(dialogs).toEqual([]);
  });
});

test.describe('Login UI — security (injection)', () => {
  test('TC-001-11 injection-style input opens no dialog and is rejected', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: each injection-style value in the email field (stopped by client validation), then
    // in the password field with a well-formed TEST_ email (rejected by the server). Each case
    // names the rejection signal to wait for, which also proves the app reacted before the checks.
    const cases = INJECTION_INPUTS.flatMap((input) => [
      { label: `email: ${input}`, credentials: { email: input, password: TEST_PASSWORD }, rejection: loginPage.validEmailMessage },
      { label: `password: ${input}`, credentials: { email: UNKNOWN_EMAIL, password: input }, rejection: loginPage.incorrectCredentialsAlert },
    ]);
    const dialogs = loginPage.recordDialogs();
    // Six cases, each with a page load, a server round trip or a toast to outlive: the default
    // 30 s test budget is per test, not per case, so the test gets Playwright's slow budget (x3).
    test.slow();

    for (const { label, credentials, rejection } of cases) {
      await loginPage.open();
      // open() changes only the hash route, so the toast of the previous value may still be on
      // screen; wait until it is gone so each value is judged on its own alert.
      await expect(loginPage.incorrectCredentialsAlert, label).toHaveCount(0, { timeout: API_TIMEOUT_MS });

      // Act
      await loginPage.login(credentials);

      // Assert: the login was rejected (RF-9) and no value was executed as script (RF-8).
      await expect(rejection, label).toBeVisible({ timeout: API_TIMEOUT_MS });
      await expect(page, label).toHaveURL(LOGIN_ROUTE_PATTERN);
      await expect(navBar.signOutButton, label).toBeHidden();
      expect(dialogs, label).toEqual([]);
    }
  });
});

test.describe('Login UI — boundary', () => {
  test('TC-001-08 both fields empty show both required messages', { tag: ['@regression', '@ui'] }, async ({ page, loginPage }) => {
    // Arrange
    await loginPage.open();

    // Act: submit without touching either field.
    await loginPage.submit();

    // Assert: both validations fire together (RF-4, RF-5) and the customer stays on login (RF-9).
    await expect(loginPage.emailRequiredMessage).toBeVisible();
    await expect(loginPage.passwordRequiredMessage).toBeVisible();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
  });
});

test.describe('Login UI — security (input handling)', () => {
  test('TC-001-12 password field masks typed characters', { tag: ['@regression', '@ui'] }, async ({ loginPage }) => {
    // Arrange
    await loginPage.open();

    // Act: a TEST_ value, typed with fill because it is not a secret.
    await loginPage.passwordInput.fill(TEST_PASSWORD);

    // Assert: the input type is "password", the only DOM-observable proof of masking (RF-10).
    await expect(loginPage.passwordInput).toHaveAttribute('type', PASSWORD_INPUT_TYPE);
  });
});

test.describe('Login UI — negative (session)', () => {
  test('TC-001-05 login page without a session shows no Sign Out', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: a fresh browser context, so there is no session.
    await loginPage.open();

    // Act: reload, which must not create or restore any session.
    await page.reload();

    // Assert: still on the login route with the form ready, and no Sign Out control. Waiting for
    // the Login button first proves the page rendered, so the absence of Sign Out is meaningful.
    await expect(loginPage.loginButton).toBeVisible();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(navBar.signOutButton).toBeHidden();
  });
});

test.describe('Login UI — security', () => {
  test('TC-001-31 dashboard without a session redirects to the login page', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, dashboardPage, loginPage, navBar }) => {
    // Arrange: a guest without a session.

    // Act: open the protected dashboard route directly.
    await dashboardPage.open();

    // Assert: access is refused by sending the guest to the login route (RF-23).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(navBar.signOutButton).toBeHidden();
  });
});
