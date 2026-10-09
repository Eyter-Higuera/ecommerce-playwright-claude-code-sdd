import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { cardEntries, matchingProducts } from '../../src/data/catalog-oracle';
import {
  FILTER_OPTIONS,
  NON_NUMERIC_BOUNDS,
  anyProduct,
  conflictingCriterion,
  firstWord,
  highestPrice,
  lowestPrice,
  optionWithProducts,
  optionWithoutProducts,
  type FilterGroup,
} from '../../src/data/catalog-data';
import { keepAvailableCases, requireCatalogInput } from '../../src/fixtures/catalog-gaps';
import { resultCounterText } from '../../src/pages/catalog.constants';

// Spec 002 — Catalog and search. Filters of the dashboard (RF-7, RF-9 to RF-16). Every test starts
// logged in as account A through an API login; the expected cards are the oracle's products for the
// criteria the panel sent, over the catalog read in the same test (plan D-1). Each action waits for
// the product API answer to its own criteria (plan D-4). The browser holds the auth token, so the
// file records no trace (Spec 001 RF-27).
test.use(NO_TRACE);

/** A price typed into the panel. */
const typed = (price: number): string => String(price);
/** An empty price input: no bound. */
const NO_BOUND = '';

test.describe('Price filter — boundary', () => {
  test('TC-002-13 price range equal to a catalog price includes its products', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: the lowest catalog price L as both bounds.
    const low = lowestPrice(catalog);
    await dashboardPage.openCatalog();

    // Act
    await dashboardPage.filters.setPriceRange(typed(low), typed(low));

    // Assert: both bounds are inclusive, so every product priced L is listed, and only those (RF-9).
    const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
    expect(expected.map((product) => product.productPrice)).toContain(low);
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(expected.length));
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(expected));
  });

  test('TC-002-14 price range just above or below a price excludes its products', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Two ranges with a product API answer each: the slow budget (x3) applies.
    test.slow();

    // Arrange: one-unit ranges right above and right below the lowest catalog price L.
    const low = lowestPrice(catalog);
    const ranges = [
      { label: 'L+1 to L+1', min: typed(low + 1), max: typed(low + 1) },
      { label: 'L-1 to L-1', min: typed(low - 1), max: typed(low - 1) },
    ];
    await dashboardPage.openCatalog();

    for (const range of ranges) {
      // Act
      await dashboardPage.filters.setPriceRange(range.min, range.max);

      // Assert: only the products inside the range, and none priced L (RF-9).
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      expect(expected.map((product) => product.productPrice), range.label).not.toContain(low);
      await expect(dashboardPage.products.resultCounter, range.label).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: range.label }).toEqual(cardEntries(expected));
    }
  });
});

test.describe('Price filter — negative', () => {
  test('TC-002-15 minimum above maximum shows no product', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: the highest catalog price as minimum, below the lowest price as maximum.
    await dashboardPage.openCatalog();

    // Act
    await dashboardPage.filters.setPriceRange(typed(highestPrice(catalog)), typed(lowestPrice(catalog) - 1));

    // Assert: an empty range matches nothing: the empty state (RF-10, RF-7).
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(0));
    await expect(dashboardPage.products.cards).toHaveCount(0);
  });

  test('TC-002-16 non-numeric or single price bound is ignored', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Three ranges with a product API answer each: the slow budget (x3) applies.
    test.slow();

    // Arrange: a minimum alone (above every price), a maximum alone (below every price), then two
    // non-numeric bounds. Each would exclude every product if it were applied.
    const [nonNumericMin, nonNumericMax] = NON_NUMERIC_BOUNDS;
    const ranges = [
      { label: 'minimum only', min: typed(highestPrice(catalog) + 1), max: NO_BOUND },
      { label: 'maximum only', min: NO_BOUND, max: typed(lowestPrice(catalog) - 1) },
      { label: 'non-numeric bounds', min: nonNumericMin, max: nonNumericMax },
    ];
    await dashboardPage.openCatalog();

    for (const range of ranges) {
      // Act
      await dashboardPage.filters.setPriceRange(range.min, range.max);

      // Assert: the price range is ignored, so the whole catalog is listed (RF-11).
      await expect(dashboardPage.products.resultCounter, range.label).toHaveText(resultCounterText(catalog.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: range.label }).toEqual(cardEntries(catalog));
    }
  });
});

test.describe('Option filters — positive', () => {
  test('TC-002-17 each Categories option alone shows exactly its catalog products', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // One selection and one clearing per option, each with a product API answer: slow budget (x3).
    test.slow();

    // Arrange: every option of the group, one at a time.
    const group: FilterGroup = FILTER_OPTIONS[0];
    await dashboardPage.openCatalog();

    for (const option of group.options) {
      // Act: select the option alone.
      await dashboardPage.filters.toggleOption(group, option);

      // Assert: exactly the catalog products with that option, or the empty state (RF-12).
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      await expect(dashboardPage.products.resultCounter, option).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: option }).toEqual(cardEntries(expected));

      // Arrange the next option: clear this one, back to the whole catalog.
      await dashboardPage.filters.toggleOption(group, option);
    }
  });

  test('TC-002-18 each Sub Categories option alone shows exactly its catalog products', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // One selection and one clearing per option, each with a product API answer: slow budget (x3).
    test.slow();

    // Arrange: every option of the group, one at a time.
    const group: FilterGroup = FILTER_OPTIONS[1];
    await dashboardPage.openCatalog();

    for (const option of group.options) {
      // Act: select the option alone.
      await dashboardPage.filters.toggleOption(group, option);

      // Assert: exactly the catalog products with that option, or the empty state (RF-13).
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      await expect(dashboardPage.products.resultCounter, option).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: option }).toEqual(cardEntries(expected));

      // Arrange the next option: clear this one, back to the whole catalog.
      await dashboardPage.filters.toggleOption(group, option);
    }
  });

  test('TC-002-19 each Search For option alone shows exactly its catalog products', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // One selection and one clearing per option, each with a product API answer: slow budget (x3).
    test.slow();

    // Arrange: every option of the group, one at a time.
    const group: FilterGroup = FILTER_OPTIONS[2];
    await dashboardPage.openCatalog();

    for (const option of group.options) {
      // Act: select the option alone.
      await dashboardPage.filters.toggleOption(group, option);

      // Assert: exactly the catalog products with that option, or the empty state (RF-14).
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      await expect(dashboardPage.products.resultCounter, option).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: option }).toEqual(cardEntries(expected));

      // Arrange the next option: clear this one, back to the whole catalog.
      await dashboardPage.filters.toggleOption(group, option);
    }
  });
});

test.describe('Option filters — negative', () => {
  test('TC-002-20 a filter option without catalog products shows no card', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Up to three selections and clearings with a product API answer each: slow budget (x3).
    test.slow();

    // Arrange: per group, an option that no catalog product has (plan D-6 if every option has one).
    const cases = keepAvailableCases(FILTER_OPTIONS.map((group) => ({ label: group.name, value: optionWithoutProducts(catalog, group), group })));
    await dashboardPage.openCatalog();

    for (const item of cases) {
      // Act
      await dashboardPage.filters.toggleOption(item.group, item.value);

      // Assert: nothing matches the option, so the empty state is shown (RF-12 to RF-14, RF-7).
      await expect(dashboardPage.products.resultCounter, item.label).toHaveText(resultCounterText(0));
      await expect(dashboardPage.products.cards, item.label).toHaveCount(0);

      // Arrange the next group: clear the option.
      await dashboardPage.filters.toggleOption(item.group, item.value);
    }
  });
});

test.describe('Combined criteria — positive', () => {
  test('TC-002-21 two options of the same group show the products of either option', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Up to eight selections and clearings with a product API answer each: slow budget (x3).
    test.slow();

    // Arrange: per group, two options: Categories with and without products, and both Search For
    // options (plan D-6 drops a pair the catalog cannot provide).
    const [categories, , targetGroups] = FILTER_OPTIONS;
    const withProducts = optionWithProducts(catalog, categories);
    const withoutProducts = optionWithoutProducts(catalog, categories);
    const cases = keepAvailableCases([
      { label: 'Categories', group: categories, value: withProducts === undefined || withoutProducts === undefined ? undefined : [withProducts, withoutProducts] },
      { label: 'Search For', group: targetGroups, value: [...targetGroups.options] },
    ]);
    await dashboardPage.openCatalog();

    for (const item of cases) {
      // Act: select both options of the group.
      for (const option of item.value) await dashboardPage.filters.toggleOption(item.group, option);

      // Assert: the options combine with OR: the union of their products, at least one (RF-12,
      // RF-14, RF-15).
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      expect(expected.length, item.label).toBeGreaterThan(0);
      await expect(dashboardPage.products.resultCounter, item.label).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: item.label }).toEqual(cardEntries(expected));

      // Arrange the next group: clear both options.
      for (const option of item.value) await dashboardPage.filters.toggleOption(item.group, option);
    }
  });

  test('TC-002-22 search, price and options of several groups show only products matching all', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Five criteria with a product API answer each: slow budget (x3).
    test.slow();

    // Arrange: every criterion of one target product T: its first word, its price as both bounds,
    // and its category, sub category and target group.
    const target = anyProduct(catalog);
    const [categories, subCategories, targetGroups] = FILTER_OPTIONS;
    await dashboardPage.openCatalog();

    // Act
    await dashboardPage.filters.search(firstWord(target));
    await dashboardPage.filters.setPriceRange(String(target.productPrice), String(target.productPrice));
    await dashboardPage.filters.toggleOption(categories, target.productCategory);
    await dashboardPage.filters.toggleOption(subCategories, target.productSubCategory);
    await dashboardPage.filters.toggleOption(targetGroups, target.productFor);

    // Assert: the criteria combine with AND: only products that satisfy all of them, T included (RF-15).
    const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
    expect(expected).toContain(target);
    await expect(dashboardPage.products.resultCounter).toHaveText(resultCounterText(expected.length));
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(expected));
  });

  test('TC-002-24 clearing criteria one at a time restores the matching products', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Six criteria changes with a product API answer each: slow budget (x3).
    test.slow();

    // Arrange: search, price range and one Categories option of a target product, all active.
    const target = anyProduct(catalog);
    const [categories] = FILTER_OPTIONS;
    await dashboardPage.openCatalog();
    await dashboardPage.filters.search(firstWord(target));
    await dashboardPage.filters.setPriceRange(String(target.productPrice), String(target.productPrice));
    await dashboardPage.filters.toggleOption(categories, target.productCategory);
    const steps = [
      { label: 'option cleared', clear: async () => dashboardPage.filters.toggleOption(categories, target.productCategory) },
      { label: 'price range cleared', clear: async () => dashboardPage.filters.clearPriceRange() },
      { label: 'search text cleared', clear: async () => dashboardPage.filters.search('') },
    ];

    for (const step of steps) {
      // Act
      await step.clear();

      // Assert: the list widens to the products matching the remaining criteria (RF-16).
      const expected = matchingProducts(catalog, dashboardPage.filters.criteria);
      await expect(dashboardPage.products.resultCounter, step.label).toHaveText(resultCounterText(expected.length));
      await expect.poll(async () => dashboardPage.products.entries(), { message: step.label }).toEqual(cardEntries(expected));
    }

    // Assert: with every criterion cleared, the whole catalog is listed again (RF-16).
    await expect.poll(async () => dashboardPage.products.entries()).toEqual(cardEntries(catalog));
  });
});

test.describe('Combined criteria — negative', () => {
  test('TC-002-23 a combination that no product satisfies shows no card', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, catalog }) => {
    // Arrange: the first word of a target product T, plus a criterion that another product meets
    // but T does not (plan D-6: a Categories option when the catalog has one).
    const target = anyProduct(catalog);
    const conflict = requireCatalogInput('criterion of another product', conflictingCriterion(catalog, target));
    await dashboardPage.openCatalog();
    await dashboardPage.filters.search(firstWord(target));

    // Act: add the conflicting criterion.
    await dashboardPage.filters.addCriterion(conflict);

    // Assert: each criterion matches products on its own, but none together (RF-15, RF-7).
    expect(matchingProducts(catalog, dashboardPage.filters.criteria), conflict.label).toEqual([]);
    await expect(dashboardPage.products.resultCounter, conflict.label).toHaveText(resultCounterText(0));
    await expect(dashboardPage.products.cards, conflict.label).toHaveCount(0);
  });
});
