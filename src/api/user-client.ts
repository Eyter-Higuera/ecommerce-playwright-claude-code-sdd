import { buildAddToCartUrl, buildCartCountUrl, buildCartProductsUrl, buildRemoveFromCartUrl } from '../config/urls';
import { API_TIMEOUT_MS } from '../config/timeouts';
import { sendSafely, type ApiRequestContext, type ApiResult } from './api-result';

// API client for the shop's protected user endpoints (Spec 001, RF-24 to RF-26) and the cart API
// (Spec 004, RF-16 to RF-28). The token goes in
// `Authorization` exactly as the login returned it, with no `Bearer` prefix (observed). The header
// value is never logged.

const AUTHORIZATION_HEADER = 'Authorization';

export class UserClient {
  constructor(
    private readonly request: ApiRequestContext,
    private readonly apiBaseUrl: string,
  ) {}

  /**
   * `GET {API_BASE_URL}/user/get-cart-count/{userId}`. `authorization` is sent as given (an empty
   * string is sent empty); `undefined` sends no Authorization header at all.
   */
  async getCartCount(userId: string, authorization?: string): Promise<ApiResult> {
    const headers: Record<string, string> = authorization === undefined ? {} : { [AUTHORIZATION_HEADER]: authorization };
    return sendSafely(async () => this.request.get(buildCartCountUrl(this.apiBaseUrl, userId), { headers, timeout: API_TIMEOUT_MS }));
  }

  /**
   * Spec 004: `POST {API_BASE_URL}/user/add-to-cart` with `{ _id: userId, product }`. `product` is
   * sent as given, so tests can send altered products or none (`undefined` leaves it out).
   */
  async addToCart(userId: string, product: unknown, authorization?: string): Promise<ApiResult> {
    const data = product === undefined ? { _id: userId } : { _id: userId, product };
    return sendSafely(async () => this.request.post(buildAddToCartUrl(this.apiBaseUrl), { data, headers: headersFor(authorization), timeout: API_TIMEOUT_MS }));
  }

  /** Spec 004: `GET {API_BASE_URL}/user/get-cart-products/{userId}`. */
  async getCartProducts(userId: string, authorization?: string): Promise<ApiResult> {
    return sendSafely(async () => this.request.get(buildCartProductsUrl(this.apiBaseUrl, userId), { headers: headersFor(authorization), timeout: API_TIMEOUT_MS }));
  }

  /** Spec 004: `DELETE {API_BASE_URL}/user/remove-from-cart/{userId}/{productId}`. */
  async removeFromCart(userId: string, productId: string, authorization?: string): Promise<ApiResult> {
    return sendSafely(async () => this.request.delete(buildRemoveFromCartUrl(this.apiBaseUrl, userId, productId), { headers: headersFor(authorization), timeout: API_TIMEOUT_MS }));
  }
}

/** The Authorization header as given; `undefined` sends none at all. */
function headersFor(authorization: string | undefined): Record<string, string> {
  return authorization === undefined ? {} : { [AUTHORIZATION_HEADER]: authorization };
}
