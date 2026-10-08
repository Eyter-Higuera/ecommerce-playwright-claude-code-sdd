// URL building (Spec 000, RF-52, RF-54). The target shop is a single-page app with hash routes,
// so routes are appended to BASE_URL as `/#/<route>` with exactly one `/` in between.

/** Hash route of the login page, relative to BASE_URL. */
export const LOGIN_ROUTE = '#/auth/login';

/** Path of the login endpoint, relative to API_BASE_URL. */
export const AUTH_LOGIN_PATH = 'auth/login';

/** Joins a base URL and a relative path with exactly one `/`. */
export function joinUrl(baseUrl: string, relativePath: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
}

/** BASE_URL + `/#/auth/login`, with or without a trailing slash in BASE_URL. */
export function buildLoginUrl(baseUrl: string): string {
  return joinUrl(baseUrl, LOGIN_ROUTE);
}

/** API_BASE_URL + `/auth/login`. */
export function buildAuthLoginUrl(apiBaseUrl: string): string {
  return joinUrl(apiBaseUrl, AUTH_LOGIN_PATH);
}
