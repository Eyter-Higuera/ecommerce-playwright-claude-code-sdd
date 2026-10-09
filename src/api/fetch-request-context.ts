import type { LoginRequestContext } from './auth-client';
import type { ApiRequestContext } from './api-result';
import type { LoginHttpResponse } from './login-response';

// The HTTP transport of every API client (Spec 004 T11, user decision; Spec 001 RF-27). Playwright's
// `request` records each call as a report step, and a call that fails before an answer stores a
// "Call log" with the request headers, Authorization included, in the HTML report. Node's built-in
// `fetch` (no new dependency) creates no steps, so a token or password can never reach a report this
// way. The adapter keeps the shape the clients already use.

type Method = 'GET' | 'POST' | 'DELETE';

interface RequestOptions {
  data?: unknown;
  headers?: Record<string, string>;
  timeout: number;
}

const JSON_HEADERS = { 'content-type': 'application/json' } as const;

/** A response read once: status, headers and body text (the clients read the body once). */
function toResponse(status: number, headers: Headers, body: string): LoginHttpResponse {
  const headerMap: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerMap[key] = value;
  });
  return { status: () => status, headers: () => headerMap, text: () => Promise.resolve(body) };
}

/**
 * The network failure without request details: its message keeps the system error code (e.g.
 * ECONNREFUSED, ENOTFOUND) or "timed out", which Spec 000 RF-57 classifies, and never the headers.
 */
function networkError(method: Method, error: unknown): Error {
  const cause = error instanceof Error ? (error.cause as { code?: unknown } | undefined) : undefined;
  const code = typeof cause?.code === 'string' ? cause.code : undefined;
  const timedOut = error instanceof Error && error.name === 'TimeoutError';
  const reason = timedOut ? 'timed out' : (code ?? (error instanceof Error ? error.message : 'unknown network error'));
  return new Error(`${method} request failed: ${reason}`);
}

async function send(method: Method, url: string, options: RequestOptions): Promise<LoginHttpResponse> {
  const hasBody = options.data !== undefined;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { ...(hasBody ? JSON_HEADERS : {}), ...options.headers },
      body: hasBody ? JSON.stringify(options.data) : undefined,
      signal: AbortSignal.timeout(options.timeout),
    });
  } catch (error) {
    throw networkError(method, error);
  }
  return toResponse(response.status, response.headers, await response.text());
}

/** Implements the request shape of every API client with Node's `fetch`. */
export class FetchRequestContext implements ApiRequestContext, LoginRequestContext {
  async get(url: string, options: { headers: Record<string, string>; timeout: number }): Promise<LoginHttpResponse> {
    return send('GET', url, options);
  }

  async post(url: string, options: { data: unknown; headers?: Record<string, string>; timeout: number }): Promise<LoginHttpResponse> {
    return send('POST', url, options);
  }

  async delete(url: string, options: { headers: Record<string, string>; timeout: number }): Promise<LoginHttpResponse> {
    return send('DELETE', url, options);
  }
}
