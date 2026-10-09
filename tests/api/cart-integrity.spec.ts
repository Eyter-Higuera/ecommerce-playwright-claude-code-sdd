import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { cartListSchema } from '../../src/api/schemas/cart.schema';
import { UNKNOWN_PRODUCT_ID, anyProduct } from '../../src/data/catalog-data';

// Spec 004 — Cart. Cart data integrity (RF-20 to RF-22): the cart must not take prices or products
// from the client. All three behaviors fail today and are known defects (spec Known issues), so each
// test is an expected failure (plan D-5): it passes while the defect exists and fails the run once the
// shop fixes it, which is the signal to remove its marker. The assertions stay as strict as the RFs.
// Each test works with its own TEST_ customer, whose cart is emptied in teardown.

const KNOWN_DEFECT_RF_20 = 'Known defect (spec 004 Known issues): the cart API keeps a price sent by the client (RF-20)';
const KNOWN_DEFECT_RF_21 = 'Known defect (spec 004 Known issues): the cart API accepts a product that is not in the catalog (RF-21)';
const KNOWN_DEFECT_RF_22 = 'Known defect (spec 004 Known issues): adding without a product is not answered with a 4xx (HTTP 500 or 200 observed; RF-22)';

/** Name of the product that is not in the catalog (TC-004-22). */
const GHOST_PRODUCT_NAME = 'TEST_ghost';

/** True for an HTTP 4xx status: a client error, as RF-20 to RF-22 require. */
function isClientError(status: number): boolean {
  return status >= HTTP_STATUS.BAD_REQUEST && status < HTTP_STATUS.FIRST_SERVER_ERROR;
}

/** RF-20 holds when the altered add is refused, or when the cart lists the product at its catalog price. */
function clientPriceIgnored(added: ApiResult, listed: ApiResult, productId: string, catalogPrice: number): boolean {
  if (isClientError(added.status)) return true;
  const line = cartListSchema.safeParse(listed.json).data?.products.find((product) => product._id === productId);
  return line?.productPrice === catalogPrice;
}

/** The ids of the products a cart answer lists (none for an empty or error answer). */
function listedIds(listed: ApiResult): string[] {
  return cartListSchema.safeParse(listed.json).data?.products.map((product) => product._id) ?? [];
}

test.describe('Cart data integrity — security', () => {
  test('TC-004-21 cart API keeps the catalog price when a different price is sent', { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, catalog }) => {
    test.fail(true, KNOWN_DEFECT_RF_20);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_20 });

    // Arrange: one catalog product and three altered prices: 0, 1 and one below the catalog price.
    const product = anyProduct(catalog);
    const alteredPrices = [0, 1, product.productPrice - 1];

    for (const price of alteredPrices) {
      // Act: add the product with the altered price, then read the cart.
      const added = await userClient.addToCart(customer.userId, { ...product, productPrice: price }, customer.token);
      const listed = await userClient.getCartProducts(customer.userId, customer.token);

      // Assert: the client cannot set the price (RF-20). Soft: every price is reported.
      expect.soft(clientPriceIgnored(added, listed, product._id, product.productPrice), `price ${String(price)} refused or replaced by the catalog price`).toBe(true);

      // Arrange the next price: empty the cart again.
      await userClient.removeFromCart(customer.userId, product._id, customer.token);
    }
  });

  test('TC-004-22 cart API rejects a product that is not in the catalog', { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, catalog }) => {
    test.fail(true, KNOWN_DEFECT_RF_21);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_21 });

    // Arrange: a catalog product turned into one that does not exist (unknown id, TEST_ name).
    const ghost = { ...anyProduct(catalog), _id: UNKNOWN_PRODUCT_ID, productName: GHOST_PRODUCT_NAME };

    // Act
    const added = await userClient.addToCart(customer.userId, ghost, customer.token);
    const listed = await userClient.getCartProducts(customer.userId, customer.token);

    // Assert: refused as a client error, and the cart stays empty (RF-21). Soft: both are reported.
    expect.soft(added.status, 'status').toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    expect.soft(added.status, 'status').toBeLessThan(HTTP_STATUS.FIRST_SERVER_ERROR);
    expect.soft(listedIds(listed), 'cart products').toEqual([]);
  });
});

test.describe('Cart data integrity — negative', () => {
  test('TC-004-23 cart API rejects an add request without a product', { tag: ['@regression', '@api'] }, async ({ userClient, customer }) => {
    test.fail(true, KNOWN_DEFECT_RF_22);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_22 });

    // Arrange: the customer's own userId and no product in the body.
    const { userId, token } = customer;

    // Act
    const added = await userClient.addToCart(userId, undefined, token);

    // Assert: a client error, not a server error (RF-22).
    expect(isClientError(added.status), `status ${String(added.status)} is a 4xx`).toBe(true);
  });
});
