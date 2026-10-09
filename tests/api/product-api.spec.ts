import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS } from '../../src/api/api-result';
import { productListMessage } from '../../src/api/product-messages';
import { apiMessageSchema } from '../../src/api/schemas/auth-login.schema';
import { noProductsSchema, productAnswerSchema, productListSchema } from '../../src/api/schemas/product.schema';
import { EMPTY_CRITERIA, matchingProducts, productNames, resultSize, type ResultSize } from '../../src/data/catalog-oracle';
import {
  FILTER_OPTIONS,
  NON_NUMERIC_BOUNDS,
  NO_MATCH_NAME,
  PATTERN_SPECIAL_NAMES,
  anyProduct,
  completeName,
  firstWord,
  flippedCase,
  highestPrice,
  lastWord,
  lowestPrice,
  optionWithProducts,
  optionWithoutProducts,
  targetCriteria,
  untrimmedPrefix,
} from '../../src/data/catalog-data';
import { INJECTION_INPUTS } from '../../src/data/auth-data';
import { keepAvailableCases } from '../../src/fixtures/catalog-gaps';

// Spec 002 — Catalog and search. The product API `POST {API_BASE_URL}/product/get-all-products`
// (RF-17 to RF-21). Expected results come from the catalog read in the same test (spec
// clarification 2); no product name, price or count is hard-coded. Tokens are never printed.

/** Result sizes a case allows (see `resultSize`): any size, or at least one product. */
const ANY_SIZE: readonly ResultSize[] = ['none', 'some', 'all'];
const SOME_OR_ALL: readonly ResultSize[] = ['some', 'all'];

/** Spec Known issues: the reason TC-002-31 is an expected failure (plan D-5). */
const KNOWN_DEFECT_RF_21 = 'Known defect (spec 002 Known issues): the product API answers HTTP 500 for a name with an unbalanced "(" or "[" (RF-21)';

/** The products of any answer; an answer without a `data` list (an error body) has none. */
function productsIn(json: unknown): unknown[] {
  const parsed = productAnswerSchema.safeParse(json);
  return parsed.success ? parsed.data.data : [];
}

test.describe('Product API — positive', () => {
  test(
    'TC-002-25 product API without criteria returns the catalog contract',
    { tag: ['@smoke', '@regression', '@api', '@critical'] },
    async ({ productClient, apiSession }) => {
      // Arrange: a valid token of account A and the body the shop sends on load (no criteria).
      const { token } = apiSession;

      // Act
      const result = await productClient.getAllProducts(EMPTY_CRITERIA, token);

      // Assert: HTTP 200, then the RF-17 contract: success message, a non-empty product list with
      // the required fields, and a count equal to the list length (checked by the schema).
      expect(result.status).toBe(HTTP_STATUS.OK);
      const parsed = productListSchema.safeParse(result.json);
      expect(parsed.error?.issues ?? [], 'RF-17 contract issues').toEqual([]);
    },
  );
});

test.describe('Product API — positive (name search)', () => {
  test(
    'TC-002-26 product API name search matches the start of the name in the same letter case',
    { tag: ['@regression', '@api'] },
    async ({ productClient, apiSession, catalog }) => {
      // Arrange: texts derived from the current catalog (RF-5). The first two start a catalog name;
      // the last three must match nothing: another letter case, a later word, a leading space.
      const product = anyProduct(catalog);
      const cases = keepAvailableCases([
        { label: 'first word', value: firstWord(product), matches: true },
        { label: 'complete name', value: completeName(product), matches: true },
        { label: 'changed letter case', value: flippedCase(catalog), matches: false },
        { label: 'last word of a multi-word name', value: lastWord(catalog), matches: false },
        { label: 'prefix with a leading space', value: untrimmedPrefix(product), matches: false },
      ]);

      // Act
      const answers = await Promise.all(
        cases.map(async (item) => ({ item, result: await productClient.getAllProducts({ ...EMPTY_CRITERIA, productName: item.value }, apiSession.token) })),
      );

      // Assert: each answer is exactly the oracle's set (RF-18 with the RF-5 rule), and the oracle
      // agrees that only the first two texts find products, so a wrong oracle cannot pass silently.
      for (const { item, result } of answers) {
        const expected = matchingProducts(catalog, { ...EMPTY_CRITERIA, productName: item.value });
        expect(result.status, item.label).toBe(HTTP_STATUS.OK);
        expect(productNames(productAnswerSchema.parse(result.json).data), item.label).toEqual(productNames(expected));
        expect(expected.length > 0, `${item.label}: finds products`).toBe(item.matches);
      }
    },
  );
});

test.describe('Product API — positive (filter combinations)', () => {
  test(
    'TC-002-28 product API combines filter groups with OR within a group and AND across groups',
    { tag: ['@regression', '@api'] },
    async ({ productClient, apiSession, catalog }) => {
      // Arrange: every option alone (RF-12 to RF-14), two options of one group (OR, RF-15), and the
      // name prefix, category, sub category and target group of one product together (AND, RF-15).
      const target = anyProduct(catalog);
      const singleOptions = FILTER_OPTIONS.flatMap((group) =>
        group.options.map((option) => ({ label: `${group.name}: ${option}`, criteria: { ...EMPTY_CRITERIA, [group.field]: [option] }, sizes: ANY_SIZE })),
      );
      const categories = FILTER_OPTIONS[0];
      const twoCategories = [optionWithProducts(catalog, categories), optionWithoutProducts(catalog, categories)].filter((option) => option !== undefined);
      const combinations = [
        ...singleOptions,
        { label: 'two Categories options', criteria: { ...EMPTY_CRITERIA, productCategory: twoCategories }, sizes: SOME_OR_ALL },
        { label: 'both Search For options', criteria: { ...EMPTY_CRITERIA, productFor: FILTER_OPTIONS[2].options }, sizes: SOME_OR_ALL },
        { label: 'name, category, sub category and target group of one product', criteria: targetCriteria(target), sizes: SOME_OR_ALL },
      ];

      // Act
      const answers = await Promise.all(combinations.map(async (item) => ({ item, result: await productClient.getAllProducts(item.criteria, apiSession.token) })));

      // Assert: every answer is exactly the oracle's set with the matching message (RF-18), and the
      // combinations that include a product with products find at least one.
      for (const { item, result } of answers) {
        const expected = matchingProducts(catalog, item.criteria);
        expect(result.status, item.label).toBe(HTTP_STATUS.OK);
        expect(productNames(productAnswerSchema.parse(result.json).data), item.label).toEqual(productNames(expected));
        expect(apiMessageSchema.parse(result.json).message, item.label).toBe(productListMessage(expected.length));
        expect(item.sizes, item.label).toContain(resultSize(expected.length, catalog.length));
      }
    },
  );
});

test.describe('Product API — boundary (price range)', () => {
  test(
    'TC-002-27 product API price range uses inclusive bounds and ignores invalid bounds',
    { tag: ['@regression', '@api'] },
    async ({ productClient, apiSession, catalog }) => {
      // Arrange: ranges around the lowest catalog price L and the highest H. `sizes` are the result
      // sizes the spec rule allows: L to L keeps the products priced L (inclusive bounds, RF-9);
      // L-1 to L-1 and a minimum above the maximum find none (RF-9, RF-10); a single bound is
      // ignored, so the whole catalog comes back (RF-11); two bounds that are not numbers find none
      // (RF-25); L+1 depends on the catalog.
      const low = lowestPrice(catalog);
      const high = highestPrice(catalog);
      const [nonNumericMin, nonNumericMax] = NON_NUMERIC_BOUNDS;
      const ranges = [
        { label: 'L to L', minPrice: low, maxPrice: low, sizes: ['some', 'all'] },
        { label: 'L+1 to L+1', minPrice: low + 1, maxPrice: low + 1, sizes: ['none', 'some', 'all'] },
        { label: 'L-1 to L-1', minPrice: low - 1, maxPrice: low - 1, sizes: ['none'] },
        { label: 'H to L-1 (minimum above maximum)', minPrice: high, maxPrice: low - 1, sizes: ['none'] },
        { label: 'minimum only (H+1)', minPrice: high + 1, maxPrice: null, sizes: ['all'] },
        { label: 'maximum only (L-1)', minPrice: null, maxPrice: low - 1, sizes: ['all'] },
        { label: 'non-numeric bounds', minPrice: nonNumericMin, maxPrice: nonNumericMax, sizes: ['none'] },
      ] as const;

      // Act
      const answers = await Promise.all(
        ranges.map(async (range) => ({
          range,
          result: await productClient.getAllProducts({ ...EMPTY_CRITERIA, minPrice: range.minPrice, maxPrice: range.maxPrice }, apiSession.token),
        })),
      );

      // Assert: every answer is exactly the oracle's set with the matching message (RF-18, RF-19,
      // RF-25), and the oracle's set has the size the rule implies, so a wrong oracle cannot pass
      // silently.
      for (const { range, result } of answers) {
        const expected = matchingProducts(catalog, { ...EMPTY_CRITERIA, minPrice: range.minPrice, maxPrice: range.maxPrice });
        expect(result.status, range.label).toBe(HTTP_STATUS.OK);
        expect(productNames(productAnswerSchema.parse(result.json).data), range.label).toEqual(productNames(expected));
        expect(apiMessageSchema.parse(result.json).message, range.label).toBe(productListMessage(expected.length));
        expect(range.sizes, range.label).toContain(resultSize(expected.length, catalog.length));
      }
    },
  );
});

test.describe('Product API — negative', () => {
  test('TC-002-29 product API without matches answers No Products Found', { tag: ['@regression', '@api'] }, async ({ productClient, apiSession }) => {
    // Arrange: a TEST_ name that no product starts with.
    const criteria = { ...EMPTY_CRITERIA, productName: NO_MATCH_NAME };

    // Act
    const result = await productClient.getAllProducts(criteria, apiSession.token);

    // Assert: an empty answer is a 200 with an empty list and the RF-19 message, not an error.
    expect(result.status).toBe(HTTP_STATUS.OK);
    const parsed = noProductsSchema.safeParse(result.json);
    expect(parsed.error?.issues ?? [], 'RF-19 contract issues').toEqual([]);
  });
});

test.describe('Product API — security', () => {
  test(
    'TC-002-30 product API with injection-style names answers below 500 with no product',
    { tag: ['@regression', '@api', '@critical'] },
    async ({ productClient, apiSession }) => {
      // Arrange: the closed injection list of Spec 001, sent as the search text.
      const names = INJECTION_INPUTS;

      // Act
      const answers = await Promise.all(names.map(async (name) => ({ name, result: await productClient.getAllProducts({ ...EMPTY_CRITERIA, productName: name }, apiSession.token) })));

      // Assert: each input is plain text: no server error and no product (RF-20).
      for (const { name, result } of answers) {
        expect(result.status, name).toBeLessThan(HTTP_STATUS.FIRST_SERVER_ERROR);
        expect(productsIn(result.json), name).toEqual([]);
      }
    },
  );

  test('TC-002-31 product API with pattern special characters answers below 500', { tag: ['@regression', '@api'] }, async ({ productClient, apiSession }) => {
    // Known defect (spec Known issues, plan D-5): the shop answers HTTP 500 for `(` and `[`. It is an
    // expected failure: it passes while the defect exists and fails the run once the shop fixes
    // it, which is the signal to remove this marker. The assertion itself stays as strict as RF-21.
    test.fail(true, KNOWN_DEFECT_RF_21);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_21 });

    // Arrange: names with characters that are special in search patterns.
    const names = PATTERN_SPECIAL_NAMES;

    // Act
    const answers = await Promise.all(names.map(async (name) => ({ name, result: await productClient.getAllProducts({ ...EMPTY_CRITERIA, productName: name }, apiSession.token) })));

    // Assert: no name causes a server error (RF-21). Soft assertions report every name.
    for (const { name, result } of answers) expect.soft(result.status, name).toBeLessThan(HTTP_STATUS.FIRST_SERVER_ERROR);
  });
});
