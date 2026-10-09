import { NO_TRACE, expect, test } from '../../src/fixtures/test';
import { LOGIN_ROUTE_PATTERN } from '../../src/config/urls';
import { anyProduct } from '../../src/data/catalog-data';

// Spec 003 — Product detail. RF-8: the detail page requires a session. The browser starts with no
// stored session (the plain `test`, not `loggedInTest`). The catalog fixture logs in through the
// API outside the browser, and API calls can be recorded in a trace, so the file records no trace
// (Spec 001 RF-27).
test.use(NO_TRACE);

test.describe('Detail navigation — security', () => {
  test('TC-003-10 detail URL without a session redirects to the login page', { tag: ['@regression', '@ui', '@critical'] }, async ({ page, productDetailPage, catalog }) => {
    // Arrange: a real product id (the catalog is read through the API, outside the browser) and a
    // browser with no stored session.
    const product = anyProduct(catalog);

    // Act
    await productDetailPage.open(product._id);

    // Assert: the guest lands on the login page, and no product is shown (RF-8).
    await expect(page).toHaveURL(LOGIN_ROUTE_PATTERN);
    await expect(productDetailPage.price).toHaveCount(0);
    await expect(productDetailPage.addToCartButton).toHaveCount(0);
  });
});
