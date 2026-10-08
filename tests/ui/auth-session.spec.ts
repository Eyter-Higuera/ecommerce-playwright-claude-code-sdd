import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { CART_ROUTE_PATTERN, DASHBOARD_ROUTE_PATTERN, LOGIN_ROUTE_PATTERN } from '../../src/config/urls';

// Spec 001 — Authentication. Session behavior in the UI (RF-3, RF-12, RF-20 to RF-23). Every test
// starts logged in as account A through an API login (loggedInTest), so no password is typed in
// the browser. The browser holds the auth token, so the file records no trace (RF-27, plan D-3).
test.use(NO_TRACE);

test.describe('Session — positive', () => {
  test('TC-001-04 API-established session shows Sign Out on the dashboard', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage }) => {
    // Arrange: the context already holds the account A token from the API (no form login).

    // Act
    await dashboardPage.open();

    // Assert: the UI recognises a session that did not come from the form (RF-3).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
    await expect(dashboardPage.navBar.signOutButton).toBeVisible();
  });

  test('TC-001-16 login route opened while logged in redirects to the dashboard', { tag: ['@regression', '@ui'] }, async ({ page, loginPage, navBar }) => {
    // Arrange: a logged-in customer (API session).

    // Act: open the login route directly.
    await loginPage.open();

    // Assert: the login page is skipped (RF-12).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
    await expect(navBar.signOutButton).toBeVisible();
  });

  test('TC-001-27 reloading the dashboard keeps the session', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage }) => {
    // Arrange: a logged-in customer on the dashboard.
    await dashboardPage.open();
    await expect(dashboardPage.navBar.signOutButton).toBeVisible();

    // Act
    await page.reload();

    // Assert: the session survives the reload; the customer is not sent to login (RF-20).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
    await expect(dashboardPage.navBar.signOutButton).toBeVisible();
  });
});

test.describe('Session — positive (Sign Out)', () => {
  test('TC-001-28 Sign Out navigates to the login page', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, dashboardPage, loginPage }) => {
    // Arrange: a logged-in customer on the dashboard.
    await dashboardPage.open();
    await expect(dashboardPage.navBar.signOutButton).toBeVisible();

    // Act
    await dashboardPage.navBar.signOut();

    // Assert: the session ends on the login route with the form shown and no Sign Out (RF-21).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(dashboardPage.navBar.signOutButton).toBeHidden();
  });
});

test.describe('Session — security', () => {
  test('TC-001-29 Back after Sign Out stays on the login page', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, dashboardPage, loginPage }) => {
    // Arrange: a customer who just signed out from the dashboard.
    await dashboardPage.open();
    await dashboardPage.navBar.signOut();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);

    // Act: go back one step in the browser history, towards the dashboard.
    await page.goBack();

    // Assert: the dashboard is not shown again; the customer stays logged out (RF-22).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(dashboardPage.navBar.signOutButton).toBeHidden();
  });
});

test.describe('Session — negative', () => {
  test('TC-001-30 Back while logged in returns to the dashboard', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage }) => {
    // Arrange: a logged-in customer who moved from the dashboard to the cart.
    await dashboardPage.open();
    await dashboardPage.navBar.openCart();
    await expect(page).toHaveURL(CART_ROUTE_PATTERN);

    // Act
    await page.goBack();

    // Assert: while the session lasts, Back works normally and lands on the dashboard, not on
    // login (the counterpart of RF-22).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
    await expect(page).not.toHaveURL(CART_ROUTE_PATTERN);
    await expect(dashboardPage.navBar.signOutButton).toBeVisible();
  });
});

test.describe('Session — boundary', () => {
  test('TC-001-32 removing the stored session sends the customer to login on reload', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage, loginPage }) => {
    // Arrange: a logged-in customer on the dashboard whose stored token is then removed, the edge
    // between "session present" and "no session".
    await dashboardPage.open();
    await expect(dashboardPage.navBar.signOutButton).toBeVisible();
    await dashboardPage.clearStoredSession();

    // Act
    await page.reload();

    // Assert: the missing session is detected and the customer is sent to login (RF-23).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(loginPage.loginButton).toBeVisible();
    await expect(dashboardPage.navBar.signOutButton).toBeHidden();
  });
});
