import { NO_TRACE, cartTest as test, expect } from '../../src/fixtures/test';
import { DASHBOARD_ROUTE_PATTERN } from '../../src/config/urls';
import { productsWithSamePrice, twoNamedProducts } from '../../src/data/catalog-data';
import { requireCatalogInput } from '../../src/fixtures/catalog-gaps';
import { cartButtonText, lineMoneyText, totalText } from '../../src/pages/cart.constants';

// Spec 004 — Cart. The cart page (RF-6 to RF-9). Every test has its own freshly registered TEST_
// customer, whose session is placed in the browser through the API (no password typed) and whose
// cart is emptied after the test (plan D-1). Cart lines are set up through the cart API (plan D-3).
// The browser holds the auth token, so the file records no trace (Spec 001 RF-27).
test.use(NO_TRACE);

test.describe('Cart page — positive', () => {
  test('TC-004-06 cart page lists each product with its catalog price', { tag: ['@regression', '@ui', '@critical'] }, async ({ cartPage, userClient, customer, catalog }) => {
    // Arrange: two different catalog products in the customer's cart.
    const products = requireCatalogInput('two different products', twoNamedProducts(catalog));
    for (const product of products) await userClient.addToCart(customer.userId, product, customer.token);

    // Act
    await cartPage.open();

    // Assert: one line per product, each with its own catalog price (RF-6).
    await expect(cartPage.lines).toHaveCount(products.length);
    for (const product of products) {
      await expect(cartPage.lineNamed(product.productName), product.productName).toBeVisible();
      await expect(cartPage.priceOf(product.productName), product.productName).toHaveText(lineMoneyText(product.productPrice));
    }
  });

  test('TC-004-07 Subtotal and Total equal the sum of the line prices', { tag: ['@regression', '@ui', '@critical'] }, async ({ cartPage, userClient, customer, catalog }) => {
    // Arrange: two catalog products, preferably two with the same price, so both lines must count.
    const products = productsWithSamePrice(catalog) ?? requireCatalogInput('two different products', twoNamedProducts(catalog));
    for (const product of products) await userClient.addToCart(customer.userId, product, customer.token);
    const sum = products.reduce((total, product) => total + product.productPrice, 0);

    // Act
    await cartPage.open();

    // Assert: Subtotal and Total are the sum of the line prices (RF-7).
    await expect(cartPage.lines).toHaveCount(products.length);
    await expect(cartPage.subtotal).toHaveText(totalText('Subtotal', sum));
    await expect(cartPage.total).toHaveText(totalText('Total', sum));
  });

  test('TC-004-09 Continue Shopping returns from the cart to the dashboard', { tag: ['@regression', '@ui'] }, async ({ page, cartPage, dashboardPage }) => {
    // Arrange: the cart route of a customer with an empty cart.
    await cartPage.open();

    // Act
    await cartPage.continueShopping();

    // Assert: back on the dashboard, with the product list shown (RF-9).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
    await expect(dashboardPage.products.cards.first()).toBeVisible();
  });
});

test.describe('Cart page — boundary', () => {
  test('TC-004-08 empty cart page shows the empty message', { tag: ['@regression', '@ui'] }, async ({ cartPage, navBar }) => {
    // Arrange: a freshly registered customer, whose cart is empty.

    // Act
    await cartPage.open();

    // Assert: the empty state, no line and no totals (RF-8), and no number in the header (RF-3).
    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.lines).toHaveCount(0);
    await expect(cartPage.subtotal).toHaveCount(0);
    await expect(navBar.cartButton).toHaveText(cartButtonText(0));
  });
});
