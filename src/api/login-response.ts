import { loginApiUnreachableMessage, loginFailedStatusMessage, loginNoValidTokenMessage } from '../errors/messages';
import { loginResponseSchema } from './schemas/login-response.schema';

// Login response checks (Spec 000, RF-54 to RF-57). Pure functions over a minimal response shape,
// so the same checks run against a real Playwright APIResponse and against unit-test stubs.

export const HTTP_OK = 200;
const UNKNOWN_CONTENT_TYPE = 'unknown';
const TIMEOUT_ERROR_TYPE = 'timeout';
const UNKNOWN_ERROR_TYPE = 'unknown network error';
// Node.js system error codes that mean "no HTTP response at all" (DNS, refused, reset, ...).
const SYSTEM_ERROR_CODE = /\b(E[A-Z]{3,})\b/;
const TIMEOUT_TEXT = /timed? ?out/i;

/** The subset of Playwright's APIResponse used by the checks. */
export interface LoginHttpResponse {
  status(): number;
  headers(): Record<string, string>;
  text(): Promise<string>;
}

/** Media type without parameters, e.g. `text/html; charset=utf-8` → `text/html`. */
function mediaType(response: LoginHttpResponse): string {
  const header = response.headers()['content-type'];
  const type = header?.split(';')[0]?.trim();
  return type === undefined || type === '' ? UNKNOWN_CONTENT_TYPE : type;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Returns the token of a successful login, or throws:
 * - RF-55: status other than 200 → status code and `TEST_USER_EMAIL` (never the email value);
 * - RF-56: non-JSON body, or a token that is missing, empty, null or not a string.
 */
export async function assertLoginResponse(response: LoginHttpResponse): Promise<string> {
  const status = response.status();
  if (status !== HTTP_OK) throw new Error(loginFailedStatusMessage(status));

  const parsed = loginResponseSchema.safeParse(parseJson(await response.text()));
  if (!parsed.success) throw new Error(loginNoValidTokenMessage(status, mediaType(response)));
  return parsed.data.token;
}

/** RF-57: turns a request that got no HTTP response into "Login API unreachable: <type> (<url>)". */
export function classifyNetworkError(error: unknown, apiBaseUrl: string): Error {
  const text = error instanceof Error ? error.message : String(error);
  const code = SYSTEM_ERROR_CODE.exec(text)?.[1];
  const type = code ?? (TIMEOUT_TEXT.test(text) ? TIMEOUT_ERROR_TYPE : UNKNOWN_ERROR_TYPE);
  return new Error(loginApiUnreachableMessage(type, apiBaseUrl));
}
