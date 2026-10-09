import { buildAuthLoginUrl, buildAuthRegisterUrl } from '../config/urls';
import { API_TIMEOUT_MS } from '../config/timeouts';
import { loginSessionFailedMessage } from '../errors/messages';
import { sendSafely, HTTP_STATUS, type ApiResult } from './api-result';
import { assertLoginResponse, classifyNetworkError, type LoginHttpResponse } from './login-response';
import { authLoginSuccessSchema } from './schemas/auth-login.schema';

// API client for the shop's authentication endpoint (Spec 000, RF-54 to RF-57; Spec 001, RF-13 to
// RF-19). Tests call `login()` and get a token or a precise failure; HTTP details stay here
// (constitution #3). The request body is never logged or attached, because it holds a password
// (RF-26).

/** The part of Playwright's APIRequestContext the client needs; a stub satisfies it in unit tests. */
export interface LoginRequestContext {
  post(url: string, options: { data: unknown; timeout: number }): Promise<LoginHttpResponse>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** Token and user id of a successful API login (Spec 001, RF-13). */
export interface AuthSession {
  token: string;
  userId: string;
}

/** The request body the shop expects for credentials. */
export function toLoginBody(credentials: LoginCredentials): { userEmail: string; userPassword: string } {
  return { userEmail: credentials.email, userPassword: credentials.password };
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
        data: toLoginBody(credentials),
        timeout: API_TIMEOUT_MS,
      });
    } catch (error) {
      throw classifyNetworkError(error, this.apiBaseUrl);
    }
    return assertLoginResponse(response);
  }

  /** Sends any body to the login endpoint and returns status and body without throwing (plan D-4). */
  async postLogin(body: unknown): Promise<ApiResult> {
    return sendSafely(async () => this.request.post(buildAuthLoginUrl(this.apiBaseUrl), { data: body, timeout: API_TIMEOUT_MS }));
  }

  /**
   * Spec 004: registers a customer with `POST {API_BASE_URL}/auth/register` and returns status and
   * body without throwing. The body holds a password, so it is never logged or attached.
   */
  async register(body: unknown): Promise<ApiResult> {
    return sendSafely(async () => this.request.post(buildAuthRegisterUrl(this.apiBaseUrl), { data: body, timeout: API_TIMEOUT_MS }));
  }

  /** Logs in and returns `{ token, userId }`; throws naming only the status when the login fails. */
  async loginSession(credentials: LoginCredentials): Promise<AuthSession> {
    const result = await this.postLogin(toLoginBody(credentials));
    const parsed = authLoginSuccessSchema.safeParse(result.json);
    if (result.status !== HTTP_STATUS.OK || !parsed.success) throw new Error(loginSessionFailedMessage(result.status));
    return { token: parsed.data.token, userId: parsed.data.userId };
  }
}
