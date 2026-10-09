import { NO_TRACE, cartTest as test, expect } from '../../src/fixtures/test';
import { CART_API_MESSAGES } from '../../src/api/cart-messages';
import { CART_API_PATHS } from '../../src/config/urls';
import { testProduct } from '../../src/data/catalog-data';
import { lineMoneyText, totalText } from '../../src/pages/cart.constants';

// Spec 004 — Cart. The cart page against a controlled cart answer (RF-6, RF-7). Only the cart products
// call is mocked with page.route(); the page and the session of the test's own TEST_ customer are real
// (API login, no password typed). The browser holds the auth token, so the file records no trace
// (Spec 001 RF-27). The mocked products carry the TEST_ prefix.
test.use(NO_TRACE);

/** Matches only the cart products call `{API_BASE_URL}/user/get-cart-products/<userId>`. */
const CART_PRODUCTS_PATTERN = `**/${CART_API_PATHS.PRODUCTS}/**`;
/** The lower price boundary (0) and a large price, so the totals are the large one. */
const MOCKED_PRODUCTS = [
  testProduct({ _id: 'TEST_cart_zero_id', productName: 'TEST_Cart_Zero', productPrice: 0 }),
  testProduct({ _id: 'TEST_cart_big_id', productName: 'test_cart_big', productPrice: 999999 }),
];

test.describe('Cart page with a mocked answer — boundary', () => {
  test('TC-004-10 cart page shows the names, prices and totals of the cart answer', { tag: ['@regression', '@mocked'] }, async ({ page, cartPage }) => {
    // Arrange: the cart answer lists the two TEST_ products.
    await page.route(CART_PRODUCTS_PATTERN, (route) => route.fulfill({ json: { products: MOCKED_PRODUCTS, count: MOCKED_PRODUCTS.length, message: CART_API_MESSAGES.FOUND } }));
    const answer = page.waitForResponse((response) => response.url().includes(CART_API_PATHS.PRODUCTS));
    const sum = MOCKED_PRODUCTS.reduce((total, product) => total + product.productPrice, 0);

    // Act
    await cartPage.open();
    await answer;

    // Assert: one line per mocked product with its own price, including "$ 0" (RF-6), and the
    // totals equal their sum (RF-7).
    await expect(cartPage.lines).toHaveCount(MOCKED_PRODUCTS.length);
    for (const product of MOCKED_PRODUCTS) {
      await expect(cartPage.priceOf(product.productName), product.productName).toHaveText(lineMoneyText(product.productPrice));
    }
    await expect(cartPage.subtotal).toHaveText(totalText('Subtotal', sum));
    await expect(cartPage.total).toHaveText(totalText('Total', sum));
  });
});
