import { buildCartCountUrl } from '../config/urls';
import { API_TIMEOUT_MS } from '../config/timeouts';
import { toApiResult, type ApiRequestContext, type ApiResult } from './api-result';

// API client for the shop's protected user endpoint (Spec 001, RF-24 to RF-26). The token goes in
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
    const response = await this.request.get(buildCartCountUrl(this.apiBaseUrl, userId), { headers, timeout: API_TIMEOUT_MS });
    return toApiResult(response);
  }
}
