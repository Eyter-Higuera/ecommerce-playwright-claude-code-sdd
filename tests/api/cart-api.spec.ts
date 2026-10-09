import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS } from '../../src/api/api-result';
import { CART_API_MESSAGES } from '../../src/api/cart-messages';
import { cartCountSchema, cartListSchema, emptyCartSchema } from '../../src/api/schemas/cart.schema';
import { apiMessageSchema } from '../../src/api/schemas/auth-login.schema';
import { anyProduct, twoNamedProducts } from '../../src/data/catalog-data';
import { requireCatalogInput } from '../../src/fixtures/catalog-gaps';

// Spec 004 — Cart. The cart API (RF-16 to RF-19). Every test works with its own freshly registered
// TEST_ customer, whose cart is emptied in the fixture teardown (plan D-1). Products come from the
// catalog read in the same test. Tokens and passwords are never printed.

test.describe('Cart API — positive', () => {
  test('TC-004-17 cart API adds a catalog product', { tag: ['@smoke', '@regression', '@api', '@critical'] }, async ({ userClient, customer, catalog }) => {
    // Arrange: an empty cart and one catalog product, sent with its catalog data.
    const product = anyProduct(catalog);

    // Act
    const result = await userClient.addToCart(customer.userId, product, customer.token);

    // Assert: the add is accepted (RF-16), and the cart then lists exactly that product.
    expect(result.status).toBe(HTTP_STATUS.OK);
    expect(apiMessageSchema.parse(result.json).message).toBe(CART_API_MESSAGES.ADDED);
    const cart = cartListSchema.parse((await userClient.getCartProducts(customer.userId, customer.token)).json);
    expect(cart.products.map((item) => item._id)).toEqual([product._id]);
  });
});

test.describe('Cart API — positive (list, count, remove)', () => {
  test('TC-004-18 cart API lists and counts the products of the cart', { tag: ['@regression', '@api'] }, async ({ userClient, customer, catalog }) => {
    // Arrange: a cart with two different catalog products, added through the API.
    const products = requireCatalogInput('two different products', twoNamedProducts(catalog));
    for (const product of products) await userClient.addToCart(customer.userId, product, customer.token);

    // Act
    const [list, count] = await Promise.all([userClient.getCartProducts(customer.userId, customer.token), userClient.getCartCount(customer.userId, customer.token)]);

    // Assert: the list holds exactly the two products with a matching count, and the count endpoint
    // agrees (RF-17).
    expect(list.status).toBe(HTTP_STATUS.OK);
    const cart = cartListSchema.parse(list.json);
    expect(cart.products.map((item) => item._id).sort()).toEqual(products.map((product) => product._id).sort());
    expect(cartCountSchema.parse(count.json).count).toBe(products.length);
  });

  test('TC-004-20 cart API removes a product from the cart', { tag: ['@regression', '@api'] }, async ({ userClient, customer, catalog }) => {
    // Arrange: a cart with two different catalog products.
    const [removed, kept] = requireCatalogInput('two different products', twoNamedProducts(catalog));
    for (const product of [removed, kept]) await userClient.addToCart(customer.userId, product, customer.token);

    // Act
    const result = await userClient.removeFromCart(customer.userId, removed._id, customer.token);

    // Assert: the removal is confirmed, and only the other product is left (RF-19, RF-10).
    expect(result.status).toBe(HTTP_STATUS.OK);
    expect(apiMessageSchema.parse(result.json).message).toBe(CART_API_MESSAGES.REMOVED);
    const cart = cartListSchema.parse((await userClient.getCartProducts(customer.userId, customer.token)).json);
    expect(cart.products.map((item) => item._id)).toEqual([kept._id]);
    expect(cart.count).toBe(1);
  });
});

test.describe('Cart API — boundary', () => {
  test('TC-004-19 cart API answers No Product in Cart for an empty cart', { tag: ['@regression', '@api'] }, async ({ userClient, customer }) => {
    // Arrange: a freshly registered customer, whose cart is empty.
    const { userId, token } = customer;

    // Act
    const [list, count] = await Promise.all([userClient.getCartProducts(userId, token), userClient.getCartCount(userId, token)]);

    // Assert: both answers say the cart is empty, with no product (RF-18).
    expect(list.status).toBe(HTTP_STATUS.OK);
    expect(count.status).toBe(HTTP_STATUS.OK);
    expect(emptyCartSchema.safeParse(list.json).error?.issues ?? [], 'list: RF-18 contract issues').toEqual([]);
    expect(emptyCartSchema.safeParse(count.json).error?.issues ?? [], 'count: RF-18 contract issues').toEqual([]);
  });
});
