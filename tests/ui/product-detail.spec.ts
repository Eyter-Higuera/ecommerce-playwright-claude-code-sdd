import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { productDetailRoutePattern } from '../../src/config/urls';
import { anyProduct, productsOnFirstPage, productsWithSamePrice, twoNamedProducts } from '../../src/data/catalog-data';
import { requireCatalogInput } from '../../src/fixtures/catalog-gaps';
import { priceText } from '../../src/pages/product-detail.constants';

// Spec 003 — Product detail. The detail page of catalog products (RF-1 to RF-5). Every test starts
// logged in as account A through an API login, and the products come from the catalog read through
// the product API in the same test (plan D-1). The browser holds the auth token, so the file
// records no trace (Spec 001 RF-27).
test.use(NO_TRACE);

test.describe('Product detail — positive', () => {
  test(
    "TC-003-01 View on each catalog card opens that product's detail route",
    { tag: ['@smoke', '@regression', '@ui', '@critical'] },
    async ({ page, dashboardPage, productDetailPage, catalog }) => {
      // One dashboard load and one detail load per product: the slow budget (x3) applies.
      test.slow();

      // Arrange: every catalog product the dashboard shows (the first page, at most 9).
      const products = productsOnFirstPage(catalog);

      for (const product of products) {
        await dashboardPage.openCatalog();
        const answer = productDetailPage.answerFor(product._id);

        // Act: "View" on the card of this product, found by its name (plan D-4).
        await dashboardPage.products.view(product.productName);
        await answer;

        // Assert: the detail route of this very product (RF-1).
        await expect(page, product.productName).toHaveURL(productDetailRoutePattern(product._id));
        await expect(productDetailPage.name, product.productName).toHaveText(product.productName, { ignoreCase: true });
      }
    },
  );

  test('TC-003-02 detail page shows the name, price and description of each catalog product', { tag: ['@regression', '@ui', '@critical'] }, async ({ productDetailPage, catalog }) => {
    // One detail load per product: the slow budget (x3) applies.
    test.slow();

    for (const product of catalog) {
      // Arrange: nothing beyond the catalog; each detail route loads as a new page (plan D-3).

      // Act
      await productDetailPage.open(product._id);

      // Assert: the product's own name (any letter case), price and description (RF-2 to RF-4).
      await expect(productDetailPage.name, product._id).toHaveText(product.productName, { ignoreCase: true });
      await expect(productDetailPage.price, product._id).toHaveText(priceText(product.productPrice));
      await expect(productDetailPage.description, product._id).toHaveText(product.productDescription ?? '');
    }
  });

  test('TC-003-03 detail page shows an enabled Add to Cart control', { tag: ['@regression', '@ui'] }, async ({ productDetailPage, catalog }) => {
    // Arrange: one catalog product.
    const product = anyProduct(catalog);

    // Act
    await productDetailPage.open(product._id);

    // Assert: the control is offered and usable (RF-5); it is not activated, because its effect
    // belongs to the cart spec. The heading first proves the product has loaded.
    await expect(productDetailPage.name).toHaveText(product.productName, { ignoreCase: true });
    await expect(productDetailPage.addToCartButton).toBeVisible();
    await expect(productDetailPage.addToCartButton).toBeEnabled();
  });
});

test.describe('Product detail — boundary', () => {
  test('TC-003-04 two products with the same price open different detail pages', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage, productDetailPage, catalog }) => {
    // Arrange: two catalog products that share a price (plan D-6 skips the test if there are none).
    const pair = requireCatalogInput('two products with the same price', productsWithSamePrice(catalog));
    const [first, second] = pair;

    for (const product of pair) {
      await dashboardPage.openCatalog();
      const answer = productDetailPage.answerFor(product._id);

      // Act: "View" on this product's card.
      await dashboardPage.products.view(product.productName);
      await answer;

      // Assert: its own detail route and name, not the other product's (RF-1, RF-2).
      await expect(page, product.productName).toHaveURL(productDetailRoutePattern(product._id));
      await expect(productDetailPage.name, product.productName).toHaveText(product.productName, { ignoreCase: true });
    }

    // Assert: the two routes really are different products.
    expect(first._id).not.toBe(second._id);
  });
});

test.describe('Product detail — negative (state)', () => {
  test('TC-003-06 viewing a second product after Continue Shopping shows the second product', { tag: ['@regression', '@ui'] }, async ({ page, dashboardPage, productDetailPage, catalog }) => {
    // Arrange: the detail of product A, then back to the catalog.
    const [productA, productB] = requireCatalogInput('two products with different names', twoNamedProducts(catalog));
    await dashboardPage.openCatalog();
    const answerA = productDetailPage.answerFor(productA._id);
    await dashboardPage.products.view(productA.productName);
    await answerA;
    await expect(productDetailPage.name).toHaveText(productA.productName, { ignoreCase: true });
    await productDetailPage.continueShopping();
    await expect(dashboardPage.products.cards).toHaveCount(catalog.length);
    const answerB = productDetailPage.answerFor(productB._id);

    // Act: open product B from its card.
    await dashboardPage.products.view(productB.productName);
    await answerB;

    // Assert: only B's data is shown; nothing of A remains (RF-1 to RF-4, RF-6).
    await expect(page).toHaveURL(productDetailRoutePattern(productB._id));
    await expect(productDetailPage.name).toHaveText(productB.productName, { ignoreCase: true });
    await expect(productDetailPage.price).toHaveText(priceText(productB.productPrice));
    await expect(productDetailPage.description).toHaveText(productB.productDescription ?? '');
    await expect(productDetailPage.name).not.toHaveText(productA.productName, { ignoreCase: true });
  });
});
