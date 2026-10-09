import { describe, expect, it } from 'vitest';
import { CLI_TEST_TIMEOUT_MS, runPlaywright } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-16: a missing or malformed BASE_URL / API_BASE_URL is a
// configuration error, so the whole Playwright run stops before any test is collected, with a
// message naming the variable. Each case runs the real CLI (`playwright test --list`) in an empty
// folder, so the developer's `.env` is not loaded.
const VALID_URLS = { BASE_URL: 'https://TEST_host/client', API_BASE_URL: 'http://TEST_host/api' };
const URL_VARIABLES = ['BASE_URL', 'API_BASE_URL'] as const;
// Partitions just outside "absolute http(s) URL": unset, empty, blank, no scheme, wrong scheme.
const INVALID_VALUES: (string | undefined)[] = [undefined, '', '   ', 'TEST_host/client', 'ftp://TEST_host'];
const SUCCESS_EXIT_CODE = 0;
const LISTED_TOTAL = /Total: (\d+) tests? in \d+ files?/;
// Ten CLI runs in one test; each one starts Playwright from scratch.
const MANY_RUNS_TIMEOUT_MS = CLI_TEST_TIMEOUT_MS * 3;

describe('Base URL validation — positive', () => {
  it('TC-000-26 valid base URLs let the Playwright run start', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: absolute https and http URLs.
    const env = VALID_URLS;

    // Act
    const result = runPlaywright(['test', '--list'], { env });

    // Assert: the run starts and lists the existing tests.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(Number(LISTED_TOTAL.exec(result.output)?.[1] ?? 0)).toBeGreaterThan(0);
  });
});

describe('Base URL validation — negative', () => {
  it('TC-000-27 missing or malformed base URL stops the run before any test', { timeout: MANY_RUNS_TIMEOUT_MS }, () => {
    // Arrange: every invalid partition, for each of the two URL variables.
    const cases = URL_VARIABLES.flatMap((name) => INVALID_VALUES.map((value) => ({ name, env: { ...VALID_URLS, [name]: value } })));

    // Act
    const results = cases.map(({ name, env }) => ({ name, result: runPlaywright(['test', '--list'], { env }) }));

    // Assert: each run fails, names the invalid variable and lists no test.
    for (const { name, result } of results) {
      expect(result.exitCode, `${name} case`).not.toBe(SUCCESS_EXIT_CODE);
      expect(result.output, `${name} case`).toContain(name);
      expect(result.output, `${name} case`).not.toMatch(LISTED_TOTAL);
    }
  });
});
