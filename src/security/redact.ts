import type { EnvValues } from '../config/env';

// Sensitive values (Spec 000, RF-20 to RF-22). Only the two passwords and auth tokens are secrets.
// Emails are test identifiers: they are kept out of framework messages (RF-21) but are not
// redacted, so screenshots and traces of UI flows stay readable.

/** RF-20: the environment variables whose values are secrets. */
export const SENSITIVE_ENV_VARIABLES = ['TEST_USER_PASSWORD', 'TEST_USER_2_PASSWORD'] as const;

export const REDACTED = '[REDACTED]';

/** The configured passwords plus the given auth tokens; empty values are ignored. */
export function getSensitiveValues(env: EnvValues, tokens: readonly string[] = []): string[] {
  const passwords = SENSITIVE_ENV_VARIABLES.map((name) => env[name]);
  const candidates = [...passwords, ...tokens].filter((value): value is string => value !== undefined && value.trim() !== '');
  return [...new Set(candidates)];
}

/**
 * Replaces every occurrence of each sensitive value, plain or URL-encoded, with `[REDACTED]`.
 * Longer values are replaced first so a value that contains another one is fully hidden.
 */
export function redact(text: string, sensitiveValues: readonly string[]): string {
  const forms = sensitiveValues.flatMap((value) => [value, encodeURIComponent(value)]);
  const ordered = [...new Set(forms)].filter((form) => form !== '').sort((a, b) => b.length - a.length);
  return ordered.reduce((result, form) => result.split(form).join(REDACTED), text);
}
