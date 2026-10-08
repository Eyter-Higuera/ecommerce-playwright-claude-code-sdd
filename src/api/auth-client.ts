import { buildAuthLoginUrl } from '../config/urls';
import { API_TIMEOUT_MS } from '../config/timeouts';
import { assertLoginResponse, classifyNetworkError, type LoginHttpResponse } from './login-response';

// API client for the shop's authentication endpoint (Spec 000, RF-54 to RF-57). Tests call
// `login()` and get a token or a precise failure; HTTP details stay here (constitution #3).
// The request body is never logged or attached, because it holds a password (RF-26).

/** The part of Playwright's APIRequestContext the client needs; a stub satisfies it in unit tests. */
export interface LoginRequestContext {
  post(url: string, options: { data: unknown; timeout: number }): Promise<LoginHttpResponse>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthClient {
  constructor(
    private readonly request: LoginRequestContext,
    private readonly apiBaseUrl: string,
  ) {}

  /** `POST {API_BASE_URL}/auth/login`; returns the token or throws an RF-55/56/57 message. */
  async login(credentials: LoginCredentials): Promise<string> {
    let response: LoginHttpResponse;
    try {
      response = await this.request.post(buildAuthLoginUrl(this.apiBaseUrl), {
        data: { userEmail: credentials.email, userPassword: credentials.password },
        timeout: API_TIMEOUT_MS,
      });
    } catch (error) {
      throw classifyNetworkError(error, this.apiBaseUrl);
    }
    return assertLoginResponse(response);
  }
}
