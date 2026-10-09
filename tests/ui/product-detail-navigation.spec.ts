import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { API_TIMEOUT_MS } from '../../src/config/timeouts';
import { DASHBOARD_ROUTE_PATTERN, productDetailRoutePattern } from '../../src/config/urls';
import { cardEntries } from '../../src/data/catalog-oracle';
import { resultCounterText } from '../../src/pages/catalog.constants';
import { MALFORMED_PRODUCT_ID, UNKNOWN_PRODUCT_ID, anyProduct } from '../../src/data/catalog-data';
import { PRODUCT_DETAIL, priceText } from '../../src/pages/product-detail.constants';

// Spec 003 — Product detail. Navigation around the detail page and invalid ids (RF-6, RF-7, RF-9,
// RF-10). Every test starts with an API session for account A; the products come from the catalog
// read through the product API in the same test (plan D-1). The browser holds the auth token, so the
// file records no trace (Spec 001 RF-27). The guest case (RF-8) is in product-detail-guest.spec.ts.
test.use(NO_TRACE);

/** Spec Known issues: the reason TC-003-12 is an expected failure (plan D-5). */
const KNOWN_DEFECT_RF_10 = 'Known defect (spec 003 Known issues): a malformed id shows the alert "[object Object]" (RF-10)';
/** Any non-blank text: the alert must say something (RF-10). */
const SOME_TEXT = /\S/;

test.describe('Detail navigation — positive', () => {
  test('TC-003-07 Continue Shopping returns to the dashboard with the whole catalog', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage, productDetailPage, catalog }) => {
    // Arrange: the detail page of one catalog product.
    const product = anyProduct(catalog);
    await productDetailPage.open(product._id);
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });

    // Act
    await productDetailPage.continueShopping();

    // Assert: back on the dashboard with every catalog product listed (RF-6).
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(catalog.length));
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(catalog));
  });

  test('TC-003-08 opening the detail URL directly shows the product', { tag: ['@regression', '@ui'] }, async ({ page, productDetailPage, catalog }) => {
    // Arrange: one catalog product.
    const product = anyProduct(catalog);

    // Act: open its detail route by URL, as a new page load.
    await productDetailPage.open(product._id);

    // Assert: that product's name, price and description (RF-7), and no error alert (RF-9 and
    // RF-10 negative side). The alert is checked after the content, once the answer has arrived.
    await expect(page).toHaveURL(productDetailRoutePattern(product._id));
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });
    await expect(productDetailPage.price).toHaveText(priceText(product.productPrice));
    await expect(productDetailPage.description).toHaveText(product.productDescription ?? '');
    await expect(productDetailPage.alert).toHaveCount(0);
  });

  test('TC-003-09 reloading the detail page keeps the product', { tag: ['@regression', '@ui'] }, async ({ page, productDetailPage, catalog }) => {
    // Arrange: the detail page of one catalog product.
    const product = anyProduct(catalog);
    await productDetailPage.open(product._id);
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });

    // Act
    await page.reload();

    // Assert: the same route and the same product after the reload (RF-7).
    await expect(page).toHaveURL(productDetailRoutePattern(product._id));
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });
    await expect(productDetailPage.price).toHaveText(priceText(product.productPrice));
    await expect(productDetailPage.description).toHaveText(product.productDescription ?? '');
  });
});

test.describe('Detail navigation — negative (invalid ids)', () => {
  test('TC-003-11 detail route with an unknown id shows the Product not found alert', { tag: ['@regression', '@ui'] }, async ({ productDetailPage }) => {
    // Arrange: a well-formed id of no product.
    const id = UNKNOWN_PRODUCT_ID;

    // Act: open its detail route as a new page load.
    await productDetailPage.open(id);

    // Assert: the customer is told, within the API budget; the toast is transient (RF-9, plan D-7).
    await expect(productDetailPage.alertNamed(PRODUCT_DETAIL.PRODUCT_NOT_FOUND)).toBeVisible({ timeout: API_TIMEOUT_MS });
  });

  test('TC-003-12 detail route with a malformed id shows a readable alert', { tag: ['@regression', '@ui'] }, async ({ productDetailPage }) => {
    // Known defect (spec Known issues, plan D-5): the shop shows "[object Object]". The test is an
    // expected failure: it passes while the defect exists and fails the run once the shop fixes it,
    // which is the signal to remove this marker. The assertions stay as strict as RF-10.
    test.fail(true, KNOWN_DEFECT_RF_10);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_10 });

    // Arrange: a malformed id.
    const id = MALFORMED_PRODUCT_ID;

    // Act: open its detail route as a new page load.
    await productDetailPage.open(id);

    // Assert: an alert appears within the API budget, with a readable, non-empty text (RF-10).
    const alert = productDetailPage.alert.first();
    await expect(alert).toBeVisible({ timeout: API_TIMEOUT_MS });
    await expect(alert).toHaveAccessibleName(SOME_TEXT);
    await expect(alert).not.toHaveAccessibleName(PRODUCT_DETAIL.UNREADABLE_ALERT);
  });
});
