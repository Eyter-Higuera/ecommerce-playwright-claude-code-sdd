import { NO_TRACE, expect, test } from '../../src/fixtures/test';
import { NAVIGATION_TIMEOUT_MS } from '../../src/config/timeouts';
import { DASHBOARD_ROUTE_PATTERN } from '../../src/config/urls';

// Spec 001 — Authentication. RF-1 to RF-3: logging in through the login form. These are the only
// tests that type a real password into the browser, so the whole file records no trace, retries
// included (RF-27); the formAccountA/formAccountB fixtures refuse to run otherwise. A login is an
// API round trip plus a redirect, so the dashboard URL gets the 30 s navigation budget of the spec.
test.use(NO_TRACE);

test.describe('Login form — positive', () => {
  test(
    'TC-001-01 login form with account A opens the dashboard',
    { tag: ['@smoke', '@regression', '@ui', '@critical'] },
    async ({ page, loginPage, navBar, formAccountA }) => {
      // Arrange: a logged-out customer on the login page.
      await loginPage.open();

      // Act
      await loginPage.login(formAccountA);

      // Assert: the dashboard route and the Sign Out control prove the session (RF-1, RF-3); the
      // wrong-credentials alert never appeared (RF-7 negative side).
      await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN, { timeout: NAVIGATION_TIMEOUT_MS });
      await expect(navBar.signOutButton).toBeVisible();
      await expect(loginPage.incorrectCredentialsAlert).toBeHidden();
    },
  );

  test('TC-001-02 login form with account B opens the dashboard', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar, formAccountB }) => {
    // Arrange
    await loginPage.open();

    // Act
    await loginPage.login(formAccountB);

    // Assert: the second account logs in the same way (RF-2, RF-3).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN, { timeout: NAVIGATION_TIMEOUT_MS });
    await expect(navBar.signOutButton).toBeVisible();
  });

  test('TC-001-03 keyboard-only login with account B', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar, formAccountB }) => {
    // Arrange: the login page; from here on, no pointer action is used.
    await loginPage.open();

    // Act: type the email and press Tab; the focus must land on the password field. Then enter
    // the password (set without a pointer, so it never appears in a report step) and press Enter.
    await loginPage.typeEmailAndTab(formAccountB.email);
    await expect(loginPage.passwordInput).toBeFocused();
    await loginPage.enterPasswordAndPressEnter(formAccountB.password);

    // Assert: the login works without a mouse (RF-2).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN, { timeout: NAVIGATION_TIMEOUT_MS });
    await expect(navBar.signOutButton).toBeVisible();
  });
});
