import { NO_TRACE, cartTest as test, expect } from '../../src/fixtures/test';
import { CART_ROUTE_PATTERN, LOGIN_ROUTE_PATTERN } from '../../src/config/urls';
import { anyProduct } from '../../src/data/catalog-data';
import { cartButtonText, lineMoneyText } from '../../src/pages/cart.constants';

// Spec 004 — Cart. The cart across reloads and sign-ins (RF-13, RF-14). Every test has its own freshly
// registered TEST_ customer; its cart is set up through the API and emptied after the test. No
// password is typed: a new session comes from an API login (plan D-4). The browser holds the auth
// token, so the file records no trace (Spec 001 RF-27).
test.use(NO_TRACE);

/** Spec Known issues (clarification 8): the reason TC-004-15 is an expected failure (plan D-5). */
const KNOWN_DEFECT_RF_14 = 'Known defect (spec 004 Known issues): every new login empties the cart on the server (RF-14)';

test.describe('Cart session — positive', () => {
  test('TC-004-14 reloading the cart page keeps its lines', { tag: ['@regression', '@ui'] }, async ({ page, cartPage, userClient, customer, catalog }) => {
    // Arrange: one product in the cart, and the cart page open.
    const product = anyProduct(catalog);
    await userClient.addToCart(customer.userId, product, customer.token);
    await cartPage.open();
    await expect(cartPage.lines).toHaveCount(1);

    // Act
    await page.reload();

    // Assert: still on the cart route, with the same line and price (RF-13, RF-9 and RF-10 negative side).
    await expect(page).toHaveURL(CART_ROUTE_PATTERN);
    await expect(cartPage.lines).toHaveCount(1);
    await expect(cartPage.priceOf(product.productName)).toHaveText(lineMoneyText(product.productPrice));
  });

  test('TC-004-15 signing out and back in keeps the cart', { tag: ['@regression', '@ui'] }, async ({ page, cartPage, dashboardPage, navBar, userClient, customer, catalog }) => {
    // Known defect: passes while the shop empties the cart on login, and fails the run once it keeps
    // the cart, which is the signal to remove this marker (plan D-5). The assertions stay as RF-14.
    test.fail(true, KNOWN_DEFECT_RF_14);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_14 });

    // Arrange: one product in the cart, then Sign Out in the UI.
    const product = anyProduct(catalog);
    await userClient.addToCart(customer.userId, product, customer.token);
    await cartPage.open();
    await expect(cartPage.lines).toHaveCount(1);
    await navBar.signOut();
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);

    // Act: a new session of the same customer, from an API login (plan D-4).
    await dashboardPage.startSession(await customer.newSession());
    await cartPage.open();

    // Assert: the cart is the same as before signing out (RF-14).
    await expect(cartPage.lines).toHaveCount(1);
    await expect(cartPage.lineNamed(product.productName)).toBeVisible();
    await expect(navBar.cartButton).toHaveText(cartButtonText(1));
  });
});
