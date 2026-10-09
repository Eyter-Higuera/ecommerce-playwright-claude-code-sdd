import { NO_TRACE, expect, loggedInTest as test } from '../../src/fixtures/test';
import { PRODUCT_API_MESSAGES } from '../../src/api/product-messages';
import { PRODUCT_DETAIL_PATH } from '../../src/config/urls';
import { UNKNOWN_PRODUCT_ID, testProduct } from '../../src/data/catalog-data';
import { priceText } from '../../src/pages/product-detail.constants';

// Spec 003 — Product detail. The detail page against a controlled detail answer (RF-2 to RF-4). Only
// the product detail API call is mocked with page.route(); the page and the session are real (API
// login, no password typed). The browser holds the auth token, so the file records no trace (Spec 001
// RF-27). The mocked product carries the TEST_ prefix.
test.use(NO_TRACE);

/** Matches only the product detail API call `{API_BASE_URL}/product/get-product-detail/<id>`. */
const PRODUCT_DETAIL_API_PATTERN = `**/${PRODUCT_DETAIL_PATH}/**`;
/** Lower price boundary and a stored lower-case name, so case-insensitive matching is exercised. */
const MOCKED_PRODUCT = testProduct({ _id: UNKNOWN_PRODUCT_ID, productName: 'test_detail_product', productPrice: 0, productDescription: 'TEST_description' });

test.describe('Product detail with a mocked answer — boundary', () => {
  test('TC-003-05 detail page shows the name, price and description of the API answer', { tag: ['@regression', '@mocked'] }, async ({ page, productDetailPage }) => {
    // Arrange: the detail API answers with the TEST_ product for any id.
    await page.route(PRODUCT_DETAIL_API_PATTERN, (route) => route.fulfill({ json: { data: MOCKED_PRODUCT, message: PRODUCT_API_MESSAGES.DETAIL_FETCHED } }));
    const answer = productDetailPage.answerFor(MOCKED_PRODUCT._id);

    // Act: open the detail route of the mocked product's well-formed id.
    await productDetailPage.open(MOCKED_PRODUCT._id);
    await answer;

    // Assert: exactly the answer's data: name (any letter case), "$ 0" and the description (RF-2 to RF-4).
    await expect(productDetailPage.name).toHaveText(MOCKED_PRODUCT.productName, { ignoreCase: true });
    await expect(productDetailPage.price).toHaveText(priceText(MOCKED_PRODUCT.productPrice));
    await expect(productDetailPage.description).toHaveText(MOCKED_PRODUCT.productDescription ?? '');
  });
});
