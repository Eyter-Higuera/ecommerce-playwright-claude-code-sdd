import { NO_TRACE, cartTest as test, expect } from '../../src/fixtures/test';
import type { ApiResult } from '../../src/api/api-result';
import { CART_API_MESSAGES } from '../../src/api/cart-messages';
import { cartListSchema } from '../../src/api/schemas/cart.schema';
import { anyProduct, twoNamedProducts } from '../../src/data/catalog-data';
import { requireCatalogInput } from '../../src/fixtures/catalog-gaps';
import { CART, cartButtonText, totalText } from '../../src/pages/cart.constants';

// Spec 004 — Cart. Removing products on the cart page (RF-10 to RF-12). Every test has its own freshly
// registered TEST_ customer; cart lines are set up through the cart API (plan D-3), and each removal
// is confirmed through the API too (plan D-7). The browser holds the auth token, so the file records
// no trace (Spec 001 RF-27).
test.use(NO_TRACE);

/** Spec Known issues: the reason TC-004-13 is an expected failure (plan D-5). */
const KNOWN_DEFECT_RF_10 = 'Known defect (spec 004 Known issues): after a removal the cart page shows the old total plus the remaining price until a reload (RF-10, RF-7)';
const KNOWN_DEFECT_RF_12 = 'Known defect (spec 004 Known issues): the remove control is an icon-only button with no accessible name (RF-12)';

/** The product ids of a cart answer (none for an empty cart). */
function listedIds(result: ApiResult): string[] {
  return cartListSchema.safeParse(result.json).data?.products.map((product) => product._id) ?? [];
}

test.describe('Removing from the cart — positive', () => {
  test('TC-004-11 removing one of two products updates the lines and count', { tag: ['@regression', '@ui', '@critical'] }, async ({ cartPage, navBar, userClient, customer, catalog }) => {
    // Arrange: two different products in the cart, and the cart page open.
    const [removed, kept] = requireCatalogInput('two different products', twoNamedProducts(catalog));
    for (const product of [removed, kept]) await userClient.addToCart(customer.userId, product, customer.token);
    await cartPage.open();
    await expect(cartPage.lines).toHaveCount(2);
    const answer = cartPage.removeAnswer();

    // Act
    await cartPage.remove(removed.productName);
    await answer;

    // Assert: only the kept product is listed and the header counts 1 (RF-10), and the server cart
    // agrees (plan D-7). The totals after a removal are a known defect, checked by TC-004-30.
    await expect(cartPage.lines).toHaveCount(1);
    await expect(cartPage.lineNamed(kept.productName)).toBeVisible();
    await expect(navBar.cartButton).toHaveText(cartButtonText(1));
    expect(listedIds(await userClient.getCartProducts(customer.userId, customer.token))).toEqual([kept._id]);
  });
});

test.describe('Removing from the cart — negative (totals)', () => {
  test('TC-004-30 totals are recomputed after removing a product', { tag: ['@regression', '@ui', '@critical'] }, async ({ cartPage, userClient, customer, catalog }) => {
    // Known defect (spec Known issues, clarification 7): the expected failure passes while the shop
    // shows the wrong totals, and fails the run once it is fixed (plan D-5).
    test.fail(true, KNOWN_DEFECT_RF_10);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_10 });

    // Arrange: two different products in the cart, and the cart page open.
    const [removed, kept] = requireCatalogInput('two different products', twoNamedProducts(catalog));
    for (const product of [removed, kept]) await userClient.addToCart(customer.userId, product, customer.token);
    await cartPage.open();
    await expect(cartPage.lines).toHaveCount(2);
    const answer = cartPage.removeAnswer();

    // Act
    await cartPage.remove(removed.productName);
    await answer;

    // Assert: without a reload, the totals drop to the remaining product's price (RF-10, RF-7).
    await expect(cartPage.lines).toHaveCount(1);
    await expect(cartPage.subtotal).toHaveText(totalText('Subtotal', kept.productPrice));
    await expect(cartPage.total).toHaveText(totalText('Total', kept.productPrice));
  });
});

test.describe('Removing from the cart — boundary', () => {
  test('TC-004-12 removing the last product shows the empty state', { tag: ['@regression', '@ui'] }, async ({ page, cartPage, navBar, userClient, customer, catalog }) => {
    // Arrange: one product in the cart, and the cart page open.
    const product = anyProduct(catalog);
    await userClient.addToCart(customer.userId, product, customer.token);
    await cartPage.open();
    await expect(cartPage.lines).toHaveCount(1);
    const answer = cartPage.removeAnswer();

    // Act
    await cartPage.remove(product.productName);
    await answer;

    // Assert: the empty state and no number in the header (RF-11, RF-8); a removal is never announced
    // as an addition (RF-2 negative side).
    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.lines).toHaveCount(0);
    await expect(navBar.cartButton).toHaveText(cartButtonText(0));
    await expect(page.getByRole('alert', { name: CART_API_MESSAGES.ADDED, exact: true })).toHaveCount(0);
  });
});

test.describe('Removing from the cart — negative (accessibility)', () => {
  test('TC-004-13 the remove control has an accessible name', { tag: ['@regression', '@ui'] }, async ({ cartPage, userClient, customer, catalog }) => {
    test.fail(true, KNOWN_DEFECT_RF_12);
    test.info().annotations.push({ type: 'issue', description: KNOWN_DEFECT_RF_12 });

    // Arrange: one product in the cart, and the cart page open.
    const product = anyProduct(catalog);
    await userClient.addToCart(customer.userId, product, customer.token);

    // Act
    await cartPage.open();

    // Assert: the remove control names the remove action for assistive technology (RF-12).
    await expect(cartPage.removeButtonOf(product.productName)).toHaveAccessibleName(CART.REMOVE_ACTION_NAME);
  });
});
