import { NO_TRACE, expect, test } from '../../src/fixtures/test';
import { LOGIN_ROUTE_PATTERN } from '../../src/config/urls';

// Spec 004 — Cart. RF-15: the cart page requires a session. The browser starts with no stored session
// (the plain `test`), and no customer is registered. The file records no trace, like the other cart
// UI files (Spec 001 RF-27).
test.use(NO_TRACE);

test.describe('Cart without a session — security', () => {
  test('TC-004-16 cart route without a session redirects to the login page', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, cartPage }) => {
    // Arrange: a guest browser (no stored token).

    // Act
    await cartPage.open();

    // Assert: the guest lands on the login page, with no cart line and no totals (RF-15).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(cartPage.lines).toHaveCount(0);
    await expect(cartPage.subtotal).toHaveCount(0);
  });
});
