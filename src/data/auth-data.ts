import { TEST_DATA_PREFIX } from './test-data-factory';

// Test data for Spec 001 (Authentication). Nothing here is created on the shop: these values are
// sent in login attempts that must fail, so every made-up value carries the TEST_ prefix and the
// reserved `.test` domain, which can never belong to a real customer.

/** A well-formed email of no registered account (TC-001-07, 10, 11, 14, 15, 20, 21, 23, 24). */
export const UNKNOWN_EMAIL = 'TEST_nobody@example.test';

/** A password of no real account, for attempts that must fail. */
export const TEST_PASSWORD = 'TEST_pass_x';

/** Emails that are not in a valid email format (RF-6, TC-001-09). */
export const INVALID_EMAILS = ['TEST_not_an_email', 'TEST_@', '@example.test'] as const;

/** The spec's closed list of injection-style input (shared definitions; RF-8, RF-17). */
export const INJECTION_INPUTS = [`' OR '1'='1`, `<script>alert('TEST')</script>`, `"><img src=x onerror=alert('TEST')>`] as const;

/** RF-18: values longer than this many characters must be rejected. */
export const MAX_FIELD_LENGTH = 255;

const TEST_EMAIL_DOMAIN = '@example.test';
const FILLER = 'x';

/** `TEST_xxx…` of exactly `length` characters (TC-001-25). */
export function valueOfLength(length: number): string {
  return TEST_DATA_PREFIX + FILLER.repeat(length - TEST_DATA_PREFIX.length);
}

/** `TEST_xxx…@example.test` of exactly `length` characters (TC-001-25). */
export function emailOfLength(length: number): string {
  return TEST_DATA_PREFIX + FILLER.repeat(length - TEST_DATA_PREFIX.length - TEST_EMAIL_DOMAIN.length) + TEST_EMAIL_DOMAIN;
}

const SURROUNDING_SPACES = '  ';

/** The email with two leading and two trailing spaces (RF-19, TC-001-26). */
export function untrimmed(email: string): string {
  return `${SURROUNDING_SPACES}${email}${SURROUNDING_SPACES}`;
}

/** The email in upper case (RF-19, TC-001-26). */
export function upperCased(email: string): string {
  return email.toUpperCase();
}

/** The wrong password sent once per run to test account A (RF-14, RF-28). */
const WRONG_PASSWORD = 'TEST_wrong_pass';

/**
 * Credentials with the real email and a wrong password. RF-28 allows at most one such login for
 * account A per Playwright invocation, none for account B; the static check in
 * scripts/check-wrong-password.ts counts the calls of this function, so it is the only allowed way
 * to build them.
 */
export function withWrongPassword(account: { email: string }): { email: string; password: string } {
  return { email: account.email, password: WRONG_PASSWORD };
}

/** Characters written over the end of a valid token to forge it (RF-26, TC-001-35). */
const TAMPER_SUFFIX = 'AAAA';
/** Used instead when the token already ends with TAMPER_SUFFIX, so the result always differs. */
const ALTERNATIVE_TAMPER_SUFFIX = 'BBBB';

/** The token with its last 4 characters replaced. */
export function tamperToken(token: string): string {
  const head = token.slice(0, -TAMPER_SUFFIX.length);
  const tail = token.slice(-TAMPER_SUFFIX.length);
  return head + (tail === TAMPER_SUFFIX ? ALTERNATIVE_TAMPER_SUFFIX : TAMPER_SUFFIX);
}

/** Authorization values that are not tokens (TC-001-36). */
export const MALFORMED_AUTHORIZATION = {
  NOT_A_TOKEN: 'TEST_not_a_token',
  EMPTY: '',
} as const;
