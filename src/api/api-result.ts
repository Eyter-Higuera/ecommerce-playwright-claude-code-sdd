// Raw API results (Spec 001, plan D-4). Negative API tests must read 4xx bodies, so these helpers
// return the status and the parsed body instead of throwing on a non-200 answer.

/** HTTP statuses named by Spec 001. */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  /** First status of the 5xx range: RF-17 and RF-18 require a 4xx, never a 5xx. */
  FIRST_SERVER_ERROR: 500,
} as const;

/** The subset of Playwright's APIResponse the helpers read; a stub satisfies it in unit tests. */
export interface ApiHttpResponse {
  status(): number;
  text(): Promise<string>;
}

/** The subset of Playwright's APIRequestContext the API clients use. */
export interface ApiRequestContext {
  /** `headers` is optional so callers without headers stay unchanged (Spec 002, plan D-2). */
  post(url: string, options: { data: unknown; headers?: Record<string, string>; timeout: number }): Promise<ApiHttpResponse>;
  get(url: string, options: { headers: Record<string, string>; timeout: number }): Promise<ApiHttpResponse>;
  /** Spec 004: removing a product from the cart. */
  delete(url: string, options: { headers: Record<string, string>; timeout: number }): Promise<ApiHttpResponse>;
}

export interface ApiResult {
  status: number;
  /** Parsed JSON body; `undefined` when the body is empty or not JSON. */
  json: unknown;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function toApiResult(response: ApiHttpResponse): Promise<ApiResult> {
  return { status: response.status(), json: parseJson(await response.text()) };
}

/**
 * Spec 001 RF-27 (found in Spec 004 T11): when a request fails before an answer (e.g. "socket hang
 * up"), Playwright's error message carries a call log that lists the request headers, Authorization
 * included, and that message ends up in the reports. The error is rethrown with its first line only.
 */
export async function sendSafely(call: () => Promise<ApiHttpResponse>): Promise<ApiResult> {
  let response: ApiHttpResponse;
  try {
    response = await call();
  } catch (error) {
    throw new Error(`API request failed: ${firstLine(error)}`);
  }
  return toApiResult(response);
}

/** The first line of an error message (the part without Playwright's call log). */
function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0] ?? '';
}
