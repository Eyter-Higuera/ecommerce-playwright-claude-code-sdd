import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { PRODUCT_LIST_PATH } from '../../src/config/urls';
import { cardEntries } from '../../src/data/catalog-oracle';
import { productListAnswer, testProduct } from '../../src/data/catalog-data';
import { resultCounterText } from '../../src/pages/catalog.constants';

// Spec 002 — Catalog and search. The listing against controlled product API answers (RF-1 to RF-4,
// RF-7). Only the product API call is mocked with page.route(); the dashboard and the session are
// real (API login, no password typed). The browser holds the auth token, so the file records no
// trace (Spec 001 RF-27). Mocked products carry the TEST_ prefix.
test.use(NO_TRACE);

/** Matches only the product API call `{API_BASE_URL}/product/get-all-products`. */
const PRODUCT_API_PATTERN = `**/${PRODUCT_LIST_PATH}`;
/** Two TEST_ products with distinct prices; the second name is stored in lower case. */
const MOCKED_PRODUCTS = [testProduct({ productName: 'TEST_Catalog_Alpha', productPrice: 101 }), testProduct({ productName: 'test_catalog_beta', productPrice: 202 })];

test.describe('Product listing with a mocked answer — positive', () => {
  test('TC-002-05 cards show the name and price of each product in the API answer', { tag: ['@regression', '@mocked'] }, async ({ page, dashboardPage }) => {
    // Arrange: the product API returns exactly the two TEST_ products.
    await page.route(PRODUCT_API_PATTERN, (route) => route.fulfill({ json: productListAnswer(MOCKED_PRODUCTS) }));
    const answer = page.waitForResponse((response) => response.url().endsWith(PRODUCT_LIST_PATH));

    // Act
    await dashboardPage.open();
    await answer;

    // Assert: two cards, each pairing its own name (any letter case) with its own price (RF-2).
    await expect(dashboardPage.products.cards).toHaveCount(MOCKED_PRODUCTS.length);
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(MOCKED_PRODUCTS));
  });
});

test.describe('Product listing with a mocked answer — boundary', () => {
  test('TC-002-04 empty product API answer shows no card and Showing 0 results', { tag: ['@regression', '@mocked'] }, async ({ page, dashboardPage }) => {
    // Arrange: the product API returns no product, as the shop does when nothing matches.
    await page.route(PRODUCT_API_PATTERN, (route) => route.fulfill({ json: productListAnswer([]) }));
    const answer = page.waitForResponse((response) => response.url().endsWith(PRODUCT_LIST_PATH));

    // Act
    await dashboardPage.open();
    await answer;

    // Assert: the empty state: the counter reads 0, and no card or card control exists (RF-1,
    // RF-3, RF-4, RF-7). The counter is checked first, so the list has rendered the empty answer.
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(0));
    await expect(dashboardPage.products.cards).toHaveCount(0);
    await expect(dashboardPage.products.allViewButtons).toHaveCount(0);
    await expect(dashboardPage.products.allAddToCartButtons).toHaveCount(0);
  });
});
