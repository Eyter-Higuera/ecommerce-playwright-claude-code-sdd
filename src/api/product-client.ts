import { buildProductDetailUrl, buildProductListUrl } from '../config/urls';
import { API_TIMEOUT_MS } from '../config/timeouts';
import type { ProductCriteria } from '../data/catalog-oracle';
import { sendSafely, type ApiRequestContext, type ApiResult } from './api-result';

// API client for the shop's product API (Spec 002, RF-17 to RF-24) and product detail API (Spec 003,
// RF-11 to RF-17). As for the user endpoint (Spec 001), the token goes in `Authorization` exactly as
// the login returned it, with no `Bearer` prefix, and the header value is never logged. Results are
// raw, so negative and 401 tests can read every status and body (Spec 002 plan D-2).

const AUTHORIZATION_HEADER = 'Authorization';

export class ProductClient {
  constructor(
    private readonly request: ApiRequestContext,
    private readonly apiBaseUrl: string,
  ) {}

  /**
   * `POST {API_BASE_URL}/product/get-all-products` with the criteria as the body. `authorization`
   * is sent as given; `undefined` sends no Authorization header at all.
   */
  async getAllProducts(criteria: ProductCriteria, authorization?: string): Promise<ApiResult> {
    const headers: Record<string, string> = authorization === undefined ? {} : { [AUTHORIZATION_HEADER]: authorization };
    return sendSafely(async () => this.request.post(buildProductListUrl(this.apiBaseUrl), { data: criteria, headers, timeout: API_TIMEOUT_MS }));
  }

  /**
   * `GET {API_BASE_URL}/product/get-product-detail/{id}`. `authorization` is sent as given;
   * `undefined` sends no Authorization header at all.
   */
  async getProductDetail(id: string, authorization?: string): Promise<ApiResult> {
    const headers: Record<string, string> = authorization === undefined ? {} : { [AUTHORIZATION_HEADER]: authorization };
    return sendSafely(async () => this.request.get(buildProductDetailUrl(this.apiBaseUrl, id), { headers, timeout: API_TIMEOUT_MS }));
  }
}
