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
