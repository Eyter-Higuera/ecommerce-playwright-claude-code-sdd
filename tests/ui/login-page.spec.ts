import { expect, test } from '../../src/fixtures/test';

// Spec 000 — Framework foundation. RF-52: UI sanity test. It proves the framework can reach the
// target shop in every browser and find the login form by accessible role and name; it does not
// log in (login scenarios belong to the auth spec).
test.describe('Login page sanity — positive', () => {
  test(
    'TC-000-76 login page shows email, password and Login button',
    { tag: ['@smoke', '@regression', '@ui', '@critical'] },
    async ({ loginPage }) => {
      // Arrange + Act: open BASE_URL + /#/auth/login; open() fails with RF-53's message if the page
      // answers >= 400 or does not load within the 30 s budget.
      await loginPage.open();

      // Assert: the three controls a user needs to log in are visible.
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();
    },
  );
});
