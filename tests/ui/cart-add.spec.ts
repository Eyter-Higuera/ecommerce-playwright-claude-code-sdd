import { NO_TRACE, cartTest as test, expect } from '../../src/fixtures/test';
import { API_TIMEOUT_MS } from '../../src/config/timeouts';
import { cartListSchema } from '../../src/api/schemas/cart.schema';
import type { ApiResult } from '../../src/api/api-result';
import { anyProduct, twoNamedProducts } from '../../src/data/catalog-data';
import { requireCatalogInput } from '../../src/fixtures/catalog-gaps';
import { CART_API_MESSAGES } from '../../src/api/cart-messages';
import { cartButtonText } from '../../src/pages/cart.constants';

// Spec 004 — Cart. Adding products from the dashboard and the product detail page (RF-1 to RF-5).
// Every test has its own freshly registered TEST_ customer, whose session is placed in the browser
// through the API and whose cart is emptied after the test (plan D-1). Each UI add is confirmed
// through the cart API too (plan D-7). The browser holds the auth token, so the file records no
// trace (Spec 001 RF-27).
test.use(NO_TRACE);

/** The product ids of a cart answer (none for an empty cart). */
function listedIds(result: ApiResult): string[] {
  return cartListSchema.safeParse(result.json).data?.products.map((product) => product._id) ?? [];
}

test.describe('Adding to the cart — positive', () => {
  test('TC-004-01 Add To Cart on a product card adds it to the cart', { tag: ['@smoke', '@regression', '@ui', '@critical'] }, async ({ dashboardPage, cartPage, navBar, userClient, customer, catalog }) => {
    // Arrange: the dashboard with an empty cart.
    const product = anyProduct(catalog);
    await dashboardPage.openCatalog();
    const added = cartPage.addAnswer();

    // Act
    await dashboardPage.products.addToCart(product.productName);
    await added;

    // Assert: the header counts one product (RF-3), and the server cart holds exactly it (RF-1, D-7).
    await expect(navBar.cartButton).toHaveText(cartButtonText(1));
    expect(listedIds(await userClient.getCartProducts(customer.userId, customer.token))).toEqual([product._id]);
  });

  test('TC-004-02 adding a product shows the Product Added To Cart alert', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage, catalog }) => {
    // Arrange
    const product = anyProduct(catalog);
    await dashboardPage.openCatalog();

    // Act
    await dashboardPage.products.addToCart(product.productName);

    // Assert: the customer is told; the toast is transient, so it is caught within the API budget (RF-2).
    await expect(page.getByRole('alert', { name: CART_API_MESSAGES.ADDED, exact: true })).toBeVisible({ timeout: API_TIMEOUT_MS });
  });

  test('TC-004-04 Add to Cart on the product detail page adds the product', { tag: ['@regression', '@ui'] }, async ({ productDetailPage, cartPage, navBar, userClient, customer, catalog }) => {
    // Arrange: the detail page of one catalog product (Spec 003).
    const product = anyProduct(catalog);
    await productDetailPage.open(product._id);
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });
    const added = cartPage.addAnswer();

    // Act
    await productDetailPage.addToCart();
    await added;

    // Assert: the header counts one product, and the server cart holds exactly it (RF-4, D-7).
    await expect(navBar.cartButton).toHaveText(cartButtonText(1));
    expect(listedIds(await userClient.getCartProducts(customer.userId, customer.token))).toEqual([product._id]);
  });
});

test.describe('Adding to the cart — boundary', () => {
  test('TC-004-03 header count follows the number of products in the cart', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, cartPage, navBar, catalog }) => {
    // Arrange: an empty cart and two different catalog products.
    const [first, second] = requireCatalogInput('two different products', twoNamedProducts(catalog));
    await dashboardPage.openCatalog();
    await expect(navBar.cartButton).toHaveText(cartButtonText(0));

    // Act and assert, step by step: the header count follows each change (RF-3).
    for (const [index, product] of [first, second].entries()) {
      const added = cartPage.addAnswer();
      await dashboardPage.products.addToCart(product.productName);
      await added;
      await expect(navBar.cartButton, `after adding ${product.productName}`).toHaveText(cartButtonText(index + 1));
    }
    await cartPage.open();
    for (const [index, product] of [first, second].entries()) {
      const removed = cartPage.removeAnswer();
      await cartPage.remove(product.productName);
      await removed;
      await expect(navBar.cartButton, `after removing ${product.productName}`).toHaveText(cartButtonText(1 - index));
    }
  });

  test('TC-004-05 adding a product already in the cart keeps a single line', { tag: ['@regression', '@ui'] }, async ({ dashboardPage, productDetailPage, cartPage, navBar, userClient, customer, catalog }) => {
    // Arrange: the product is already in the cart, added from its card.
    const product = anyProduct(catalog);
    await dashboardPage.openCatalog();
    const firstAdd = cartPage.addAnswer();
    await dashboardPage.products.addToCart(product.productName);
    await firstAdd;
    await productDetailPage.open(product._id);
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });
    const secondAdd = cartPage.addAnswer();

    // Act: add the same product again, from its detail page.
    await productDetailPage.addToCart();
    await secondAdd;

    // Assert: one line, a header count of 1, and one product on the server (RF-5).
    await cartPage.open();
    await expect(cartPage.lines).toHaveCount(1);
    await expect(navBar.cartButton).toHaveText(cartButtonText(1));
    expect(listedIds(await userClient.getCartProducts(customer.userId, customer.token))).toEqual([product._id]);
  });
});
