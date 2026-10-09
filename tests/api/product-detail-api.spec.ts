import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { PRODUCT_API_MESSAGES, hasCleanMessage } from '../../src/api/product-messages';
import { productDetailSchema } from '../../src/api/schemas/product.schema';
import { INJECTION_INPUTS } from '../../src/data/auth-data';
import { MALFORMED_PRODUCT_ID, PRODUCT_ID_LENGTH, UNKNOWN_PRODUCT_ID, anyProduct, detailFields, idOfLength, unknownIdLike } from '../../src/data/catalog-data';

// Spec 003 — Product detail. The product detail API `GET {API_BASE_URL}/product/get-product-detail/{id}`
// (RF-11 to RF-14). Every catalog product is checked, and expected data come from the catalog read in
// the same test (spec non-functional requirements, plan D-1). Tokens are never printed.

/** Spec Known issues: the reason TC-003-16 is an expected failure (plan D-5). */
const KNOWN_DEFECT_RF_14 = 'Known defect (spec 003 Known issues): a malformed id makes the product detail API answer HTTP 500 with its database error (RF-14)';

/** What an error answer is judged on: status, message and whether product data came back. */
function outcomeOf(result: ApiResult): { status: number; message: unknown; hasData: boolean } {
  const body = typeof result.json === 'object' && result.json !== null ? (result.json as Record<string, unknown>) : {};
  return { status: result.status, message: body.message, hasData: 'data' in body };
}

test.describe('Product detail API — positive', () => {
  test(
    'TC-003-13 product detail API returns the contract for every catalog product',
    { tag: ['@smoke', '@regression', '@api', '@critical'] },
    async ({ productClient, apiSession, catalog }) => {
      // Arrange: the `_id` of every catalog product.
      const ids = catalog.map((product) => product._id);

      // Act
      const answers = await Promise.all(ids.map(async (id) => ({ id, result: await productClient.getProductDetail(id, apiSession.token) })));

      // Assert: HTTP 200 and the RF-11 contract for each product, about the product requested.
      for (const { id, result } of answers) {
        expect(result.status, id).toBe(HTTP_STATUS.OK);
        const parsed = productDetailSchema.safeParse(result.json);
        expect(parsed.error?.issues ?? [], `${id}: RF-11 contract issues`).toEqual([]);
        expect(parsed.data?.data._id, id).toBe(id);
      }
    },
  );

  test('TC-003-14 product detail API returns the same data as the catalog', { tag: ['@regression', '@api'] }, async ({ productClient, apiSession, catalog }) => {
    // Arrange: every catalog product, as the product list returned it.
    const products = catalog;

    // Act
    const answers = await Promise.all(products.map(async (product) => ({ product, result: await productClient.getProductDetail(product._id, apiSession.token) })));

    // Assert: the detail of each product agrees with the catalog on the six RF-12 fields.
    for (const { product, result } of answers) {
      const detail = productDetailSchema.parse(result.json).data;
      expect(detailFields(detail), product._id).toEqual(detailFields(product));
    }
  });
});

test.describe('Product detail API — negative', () => {
  test('TC-003-15 product detail API with an unknown id answers 400 Product not found', { tag: ['@regression', '@api'] }, async ({ productClient, apiSession, catalog }) => {
    // Arrange: well-formed ids of no product: all zeros, and a catalog id with its last 4 hex
    // characters changed (checked against the catalog).
    const ids = [UNKNOWN_PRODUCT_ID, unknownIdLike(catalog)];

    // Act
    const answers = await Promise.all(ids.map(async (id) => ({ id, result: await productClient.getProductDetail(id, apiSession.token) })));

    // Assert: each is a clean "not found", with no product data (RF-13, RF-12 negative side).
    for (const { id, result } of answers) {
      expect(outcomeOf(result), id).toEqual({ status: HTTP_STATUS.BAD_REQUEST, message: PRODUCT_API_MESSAGES.PRODUCT_NOT_FOUND, hasData: false });
    }
  });
});

test.describe('Product detail API — security', () => {
  test('TC-003-16 product detail API with malformed ids answers 4xx without internal details', { tag: ['@regression', '@api'] }, async ({ productClient, apiSession, catalog }) => {
    // Known defect (spec Known issues, plan D-5): the shop answers HTTP 500 with its database error.
    // The test is an expected failure: it passes while the defect exists and fails the run once the
    // shop fixes it, which is the signal to remove this marker. The assertions stay as strict as RF-14.
    test.fail(true, KNOWN_DEFECT_RF_14);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_14 });

    // Arrange: malformed ids: a TEST_ text, one hex character short of and over the 24-character
    // format, and the injection-style inputs of Spec 001.
    const id = anyProduct(catalog)._id;
    const ids = [MALFORMED_PRODUCT_ID, idOfLength(id, PRODUCT_ID_LENGTH - 1), idOfLength(id, PRODUCT_ID_LENGTH + 1), ...INJECTION_INPUTS];

    // Act
    const answers = await Promise.all(ids.map(async (value) => ({ value, result: await productClient.getProductDetail(value, apiSession.token) })));

    // Assert: a client error whose message names no internal error (RF-14). Soft: every id is reported.
    for (const { value, result } of answers) {
      expect.soft(result.status, value).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
      expect.soft(result.status, value).toBeLessThan(HTTP_STATUS.FIRST_SERVER_ERROR);
      expect.soft(hasCleanMessage(result.json), `${value}: message names no internal error`).toBe(true);
    }
  });
});
