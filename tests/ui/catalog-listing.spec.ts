import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { cardEntries } from '../../src/data/catalog-oracle';
import { resultCounterText } from '../../src/pages/catalog.constants';

// Spec 002 — Catalog and search. Product listing on the dashboard (RF-1 to RF-4). Every test starts
// logged in as account A through an API login, and the expected products are the catalog read
// through the product API in the same test (spec clarification 2). The browser holds the auth
// token, so the file records no trace (Spec 001 RF-27).
test.use(NO_TRACE);

test.describe('Product listing — positive', () => {
  test('TC-002-01 dashboard shows one card per catalog product', { tag: ['@smoke', '@regression', '@ui', '@critical'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: the expected cards are the catalog products: name (any letter case) and price.
    const expected = cardEntries(catalog);

    // Act
    await dashboardPage.open();

    // Assert: exactly one card per catalog product (RF-1), each with its own name and price (RF-2).
    await expect(dashboardPage.products.cards).toHaveCount(catalog.length);
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(expected);
  });

  test('TC-002-02 product cards show View and Add To Cart controls', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange
    await dashboardPage.open();
    await expect(dashboardPage.products.cards).toHaveCount(catalog.length);

    // Act: read the controls of every card.
    const cards = await dashboardPage.products.cards.all();

    // Assert: every card offers both controls (RF-3).
    for (const card of cards) {
      await expect(dashboardPage.products.viewButtonOf(card)).toBeVisible();
      await expect(dashboardPage.products.addToCartButtonOf(card)).toBeVisible();
    }
  });

  test('TC-002-03 result counter equals the number of product cards', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: the whole catalog is listed when nothing is filtered.
    const expectedCount = catalog.length;

    // Act
    await dashboardPage.open();

    // Assert: the counter, the cards and the catalog agree (RF-4).
    await expect(dashboardPage.products.cards).toHaveCount(expectedCount);
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(expectedCount));
  });
});
