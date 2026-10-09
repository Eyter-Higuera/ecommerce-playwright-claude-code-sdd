import { HTTP_STATUS } from '../api/api-result';
import type { AuthClient } from '../api/auth-client';
import { emptyCartSchema } from '../api/schemas/cart.schema';
import { productSchema } from '../api/schemas/product.schema';
import type { UserClient } from '../api/user-client';
import { buildTestCustomer } from '../data/customer-data';
import { customerSetupFailedMessage } from '../errors/messages';
import { z } from 'zod';

// Spec 004 test customers (plan D-1, D-2). A customer is registered and logged in through the API for
// one test; its cart is emptied afterwards. The password exists only inside `registerCustomer` and is
// never returned, logged or attached.

/** What a test may know about its customer: never the password. */
export interface TestCustomer {
  /** The TEST_ email, needed only to log the same customer in again. */
  email: string;
  userId: string;
  token: string;
  /** Logs the same customer in again through the API and returns a fresh token (Spec 004 plan D-4). */
  newSession(): Promise<string>;
}

/** The product ids of any cart answer; an empty or error answer has none. */
const cartIdsSchema = z.object({ products: z.array(productSchema.pick({ _id: true })) });

/** Registers a new TEST_ customer and logs it in; throws naming the failed step and status only. */
export async function registerCustomer(authClient: AuthClient, workerIndex: number): Promise<TestCustomer> {
  const registration = buildTestCustomer(workerIndex);
  const result = await authClient.register(registration);
  if (result.status !== HTTP_STATUS.OK) throw new Error(customerSetupFailedMessage('registration', result.status));
  const credentials = { email: registration.userEmail, password: registration.userPassword };
  const session = await authClient.loginSession(credentials);
  return {
    email: registration.userEmail,
    userId: session.userId,
    token: session.token,
    newSession: async () => (await authClient.loginSession(credentials)).token,
  };
}

/** Attempts for the teardown cleanup: the third-party shop sometimes drops a connection (T11). */
const CLEANUP_ATTEMPTS = 3;

/**
 * Removes every product from the customer's cart, then checks that it is empty (teardown). A network
 * failure is retried, so a dropped connection does not fail a test whose assertions passed.
 */
export async function emptyCart(userClient: UserClient, customer: TestCustomer): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await emptyCartOnce(userClient, customer);
      return;
    } catch (error) {
      if (attempt >= CLEANUP_ATTEMPTS) throw error;
    }
  }
}

async function emptyCartOnce(userClient: UserClient, customer: TestCustomer): Promise<void> {
  const listed = await userClient.getCartProducts(customer.userId, customer.token);
  const ids = cartIdsSchema.safeParse(listed.json).data?.products.map((product) => product._id) ?? [];
  for (const id of ids) await userClient.removeFromCart(customer.userId, id, customer.token);
  const after = await userClient.getCartProducts(customer.userId, customer.token);
  if (!emptyCartSchema.safeParse(after.json).success) throw new Error(customerSetupFailedMessage('cart cleanup', after.status));
}
