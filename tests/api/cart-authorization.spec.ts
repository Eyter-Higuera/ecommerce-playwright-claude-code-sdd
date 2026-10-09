import { expect, test } from '../../src/fixtures/test';
import { HTTP_STATUS, type ApiResult } from '../../src/api/api-result';
import { AUTH_API_MESSAGES } from '../../src/api/auth-messages';
import type { UserClient } from '../../src/api/user-client';
import type { Product } from '../../src/api/schemas/product.schema';
import { MALFORMED_AUTHORIZATION, tamperToken } from '../../src/data/auth-data';
import { CART_API_MESSAGES } from '../../src/api/cart-messages';
import { apiMessageSchema } from '../../src/api/schemas/auth-login.schema';
import { cartListSchema } from '../../src/api/schemas/cart.schema';
import { anyProduct } from '../../src/data/catalog-data';

// Spec 004 — Cart. Isolation between customers and authorization of the cart API (RF-23 to RF-28).
// Each test registers its own TEST_ customers; "customer 1" acts on "customer 2"'s cart, and customer
// 2's cart is always judged with customer 2's own token (plan D-8). Tokens are never printed.

/** The product ids of a cart answer; an empty or error answer lists none. */
function listedIds(result: ApiResult): string[] {
  return cartListSchema.safeParse(result.json).data?.products.map((product) => product._id) ?? [];
}

/** Every cart endpoint called with the same Authorization value (`undefined`: no header). */
async function callEveryCartEndpoint(userClient: UserClient, userId: string, product: Product, authorization: string | undefined): Promise<{ endpoint: string; result: ApiResult }[]> {
  return [
    { endpoint: 'add', result: await userClient.addToCart(userId, product, authorization) },
    { endpoint: 'list', result: await userClient.getCartProducts(userId, authorization) },
    { endpoint: 'count', result: await userClient.getCartCount(userId, authorization) },
    { endpoint: 'remove', result: await userClient.removeFromCart(userId, product._id, authorization) },
  ];
}

/** Status and message of an answer, the two things a 401 is judged on. */
function refusalOf(result: ApiResult): { status: number; message: string | undefined } {
  const parsed = apiMessageSchema.safeParse(result.json);
  return { status: result.status, message: parsed.success ? parsed.data.message : undefined };
}

/** True for an HTTP 4xx status. */
function isClientError(status: number): boolean {
  return status >= HTTP_STATUS.BAD_REQUEST && status < HTTP_STATUS.FIRST_SERVER_ERROR;
}

test.describe('Cart isolation — security', () => {
  test("TC-004-24 adding to another customer's cart is refused", { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, secondCustomer, catalog }) => {
    // Arrange: two customers with empty carts, and one catalog product.
    const product = anyProduct(catalog);

    // Act: customer 1, with its own token, adds the product to customer 2's cart.
    const added = await userClient.addToCart(secondCustomer.userId, product, customer.token);

    // Assert: refused with "Not Authorized!", and customer 2's cart is still empty (RF-23).
    expect(added.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(apiMessageSchema.parse(added.json).message).toBe(CART_API_MESSAGES.NOT_AUTHORIZED);
    expect(listedIds(await userClient.getCartProducts(secondCustomer.userId, secondCustomer.token))).toEqual([]);
  });

  test("TC-004-25 listing another customer's cart is refused", { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, secondCustomer, catalog }) => {
    // Arrange: customer 2 has one product in the cart.
    const product = anyProduct(catalog);
    await userClient.addToCart(secondCustomer.userId, product, secondCustomer.token);

    // Act: customer 1 lists customer 2's cart with its own token.
    const listed = await userClient.getCartProducts(secondCustomer.userId, customer.token);

    // Assert: a client error, and none of customer 2's products is disclosed (RF-24).
    expect(isClientError(listed.status), `status ${String(listed.status)} is a 4xx`).toBe(true);
    expect(listedIds(listed)).toEqual([]);
  });

  test("TC-004-26 removing from another customer's cart is refused", { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, secondCustomer, catalog }) => {
    // Arrange: customer 2 has one product in the cart.
    const product = anyProduct(catalog);
    await userClient.addToCart(secondCustomer.userId, product, secondCustomer.token);

    // Act: customer 1 removes it with its own token.
    const removed = await userClient.removeFromCart(secondCustomer.userId, product._id, customer.token);

    // Assert: a client error, and customer 2's cart still holds the product (RF-25).
    expect(isClientError(removed.status), `status ${String(removed.status)} is a 4xx`).toBe(true);
    expect(listedIds(await userClient.getCartProducts(secondCustomer.userId, secondCustomer.token))).toEqual([product._id]);
  });
});

test.describe('Cart API authorization — security', () => {
  test('TC-004-27 cart endpoints without Authorization answer 401', { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, catalog }) => {
    // Arrange: the customer's own userId and a catalog product, but no Authorization header.
    const product = anyProduct(catalog);

    // Act
    const answers = await callEveryCartEndpoint(userClient, customer.userId, product, undefined);

    // Assert: every endpoint refuses the call (RF-26).
    for (const { endpoint, result } of answers) {
      expect(refusalOf(result), endpoint).toEqual({ status: HTTP_STATUS.UNAUTHORIZED, message: AUTH_API_MESSAGES.NO_TOKEN });
    }
  });

  test('TC-004-28 cart endpoints with a tampered token answer 401', { tag: ['@regression', '@api', '@critical'] }, async ({ userClient, customer, catalog }) => {
    // Arrange: the customer's token with its last 4 characters replaced. The comparison is a boolean
    // so a failure never prints the token.
    const tampered = tamperToken(customer.token);
    expect(tampered === customer.token, 'the tampered token differs from the issued one').toBe(false);

    // Act
    const answers = await callEveryCartEndpoint(userClient, customer.userId, anyProduct(catalog), tampered);

    // Assert: every endpoint refuses the forged token (RF-27).
    for (const { endpoint, result } of answers) {
      expect(refusalOf(result), endpoint).toEqual({ status: HTTP_STATUS.UNAUTHORIZED, message: AUTH_API_MESSAGES.SESSION_TIMEOUT });
    }
  });

  test('TC-004-29 cart endpoints with a malformed token answer 401', { tag: ['@regression', '@api'] }, async ({ userClient, customer, catalog }) => {
    // Arrange: an Authorization value that is not a token at all (Spec 001 test data).
    const malformed = MALFORMED_AUTHORIZATION.NOT_A_TOKEN;

    // Act
    const answers = await callEveryCartEndpoint(userClient, customer.userId, anyProduct(catalog), malformed);

    // Assert: every endpoint refuses it like a bad token (RF-28).
    for (const { endpoint, result } of answers) {
      expect(refusalOf(result), endpoint).toEqual({ status: HTTP_STATUS.UNAUTHORIZED, message: AUTH_API_MESSAGES.SESSION_TIMEOUT });
    }
  });
});
