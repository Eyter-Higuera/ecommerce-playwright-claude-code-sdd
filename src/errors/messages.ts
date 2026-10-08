// Framework failure messages (Spec 000). Each builder names variables, never their values, so a
// failure can be printed to the console or a CI log without exposing test data (RF-21, RF-22).
// The builders take no email or password parameter, so they cannot print one.

/** RF-17: a TEST_USER_* (or other required) variable is missing, empty or whitespace-only. */
export function missingEnvVariableMessage(name: string): string {
  return `Missing required environment variable: ${name}`;
}

/** RF-16: BASE_URL or API_BASE_URL is set but is not an absolute http or https URL. */
export function invalidBaseUrlMessage(name: string): string {
  return `Invalid environment variable: ${name} must be an absolute http or https URL`;
}

/** RF-53: the login page answered with HTTP status >= 400, or did not load within the budget. */
export function loginPageUnavailableMessage(url: string, statusOrTimeout: number | 'timeout'): string {
  return `Login page unavailable: ${url} (${String(statusOrTimeout)})`;
}

/** RF-55: the login API answered with a status other than 200 for test account A. */
export function loginFailedStatusMessage(status: number): string {
  return `Login API returned status ${String(status)} for the account in TEST_USER_EMAIL`;
}

/** RF-56: the login response is not JSON or has no non-empty string token. */
export function loginNoValidTokenMessage(status: number, contentType: string): string {
  return `Login response has no valid token (status ${String(status)}, content-type ${contentType})`;
}

/** RF-57: no HTTP response within the budget (DNS failure, connection refused or timeout). */
export function loginApiUnreachableMessage(errorType: string, apiBaseUrl: string): string {
  return `Login API unreachable: ${errorType} (${apiBaseUrl})`;
}
