import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { DASHBOARD_ROUTE_PATTERN } from '../../src/config/urls';
import { cardEntries, matchingProducts } from '../../src/data/catalog-oracle';
import { NO_MATCH_NAME, ONLY_SPACES, anyProduct, completeName, firstWord, flippedCase, lastWord, untrimmedPrefix } from '../../src/data/catalog-data';
import { INJECTION_INPUTS } from '../../src/data/auth-data';
import { keepAvailableCases } from '../../src/fixtures/catalog-gaps';
import { resultCounterText } from '../../src/pages/catalog.constants';

// Spec 002 — Catalog and search. Search by product name on the dashboard (RF-4 to RF-8, RF-16).
// Every test starts logged in as account A through an API login; the expected cards are the
// oracle's products for the criteria the panel sent, over the catalog read in the same test (plan
// D-1). Each search waits for the product API answer to its own criteria (plan D-4). The browser
// holds the auth token, so the file records no trace (Spec 001 RF-27).
test.use(NO_TRACE);

test.describe('Search — positive', () => {
  test(
    'TC-002-06 search with the start of a product name shows only matching products',
    { tag: ['@smoke', '@regression', '@ui', '@critical'] },
    async ({ dashboardPage, catalog }) => {
      // Arrange: the first word of a catalog name, as stored.
      const text = firstWord(anyProduct(catalog));
      await dashboardPage.openCatalog();

      // Act
      await dashboardPage.filters.search(text);

      // Assert: only the products whose name starts with the text, in the same letter case (RF-5),
      // and the counter matches the cards (RF-4). The text comes from a product, so at least one.
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      expect(expected.length).toBeGreaterThan(0);
      await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(expected));
    },
  );

  test('TC-002-10 clearing the search text shows all products again', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: a search that shows a subset of the catalog.
    await dashboardPage.openCatalog();
    await dashboardPage.filters.search(firstWord(anyProduct(catalog)));

    // Act: submit an empty search text.
    await dashboardPage.filters.search('');

    // Assert: with no criterion left, the whole catalog is listed again (RF-6, RF-16).
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(catalog.length));
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(catalog));
  });
});

test.describe('Search — boundary', () => {
  test('TC-002-07 search with a complete product name shows that product', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: a complete catalog name, as stored.
    const product = anyProduct(catalog);
    await dashboardPage.openCatalog();

    // Act
    await dashboardPage.filters.search(completeName(product));

    // Assert: the named product is listed, plus only names that start with the same text (RF-5).
    const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
    expect(expected).toContain(product);
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(expected.length));
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(expected));
  });

  test('TC-002-09 search with surrounding or only spaces shows no product', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Several searches with a product API answer each: the slow budget (x3) applies.
    test.slow();

    // Arrange: a matching prefix with one leading space, and a single space. Spaces are not
    // trimmed (RF-5), so neither starts a catalog name.
    const cases = keepAvailableCases([
      { label: 'prefix with a leading space', value: untrimmedPrefix(anyProduct(catalog)) },
      { label: 'only a space', value: ONLY_SPACES },
    ]);
    await dashboardPage.openCatalog();

    for (const item of cases) {
      // Act
      await dashboardPage.filters.search(item.value);

      // Assert: the empty state for this text (RF-5, RF-7).
      await expect(dashboardPage.products.resultCounter, item.label).toHaveText(resultCounterText(0));
      await expect(dashboardPage.products.cards, item.label).toHaveCount(0);
    }
  });
});

test.describe('Search — negative', () => {
  test(
    'TC-002-08 search in another letter case or from the middle of a name shows no product',
    { tag: ['@regression', '@ui'] },
    async ({ dashboardPage, catalog }) => {
      // Several searches with a product API answer each: the slow budget (x3) applies.
      test.slow();

      // Arrange: texts derived from the catalog that start no catalog name: a name with its letter
      // case changed, and the last word of a multi-word name (plan D-6 if the catalog has none).
      const cases = keepAvailableCases([
        { label: 'changed letter case', value: flippedCase(catalog) },
        { label: 'last word of a multi-word name', value: lastWord(catalog) },
      ]);
      await dashboardPage.openCatalog();

      for (const item of cases) {
        // Act
        await dashboardPage.filters.search(item.value);

        // Assert: case-sensitive prefix match (RF-5): nothing is found, the empty state is shown (RF-7).
        await expect(dashboardPage.products.resultCounter, item.label).toHaveText(resultCounterText(0));
        await expect(dashboardPage.products.cards, item.label).toHaveCount(0);
      }
    },
  );

  test('TC-002-11 search without matches shows no card and Showing 0 results', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage }) => {
    // Arrange
    await dashboardPage.openCatalog();

    // Act: a TEST_ text that no product name starts with.
    await dashboardPage.filters.search(NO_MATCH_NAME);

    // Assert: the empty state, and the customer stays on the dashboard (RF-7, RF-4).
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(0));
    await expect(dashboardPage.products.cards).toHaveCount(0);
    await expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN);
  });
});

test.describe('Search — security', () => {
  test('TC-002-12 injection-style search opens no dialog and shows no card', { tag: ['@regression', '@ui', '@critical'] }, async ({ dashboardPage }) => {
    // Three searches with a product API answer each: the slow budget (x3) applies.
    test.slow();

    // Arrange: the closed injection list of Spec 001, and a record of every browser dialog.
    await dashboardPage.openCatalog();
    const dialogs = dashboardPage.recordDialogs();

    for (const input of INJECTION_INPUTS) {
      // Act
      await dashboardPage.filters.search(input);

      // Assert: the input is plain text that starts no product name (RF-8, RF-7).
      await expect(dashboardPage.products.resultCounter, input).toHaveText(resultCounterText(0));
      await expect(dashboardPage.products.cards, input).toHaveCount(0);
    }

    // Assert: no input ran a script that opened a dialog (RF-8).
    expect(dialogs).toEqual([]);
  });
});
