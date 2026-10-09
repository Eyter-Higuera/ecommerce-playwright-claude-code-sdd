import { describe, expect, it } from 'vitest';
import { CLI_TEST_TIMEOUT_MS, fixturePath, runPlaywright } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-13 / RF-17: a missing TEST_USER_* variable fails only the
// test that reads it, with "Missing required environment variable: <NAME>"; tests that need no
// credential still run and pass. A fixture project with two tests runs on the real Playwright CLI.
const FIXTURE_CONFIG = fixturePath('playwright', 'two-tests', 'playwright.config.ts');
const MISSING_EMAIL_MESSAGE = 'Missing required environment variable: TEST_USER_EMAIL';
// The three "missing" partitions of RF-17: unset, empty and whitespace-only.
const MISSING_VALUES: (string | undefined)[] = [undefined, '', '   '];
const MANY_RUNS_TIMEOUT_MS = CLI_TEST_TIMEOUT_MS * 2;

describe('Credential isolation — negative', () => {
  it('TC-000-28 missing credential fails only the test that reads it', { timeout: MANY_RUNS_TIMEOUT_MS }, () => {
    // Arrange: account A's password is set; its email is missing in each partition.
    const envs = MISSING_VALUES.map((email) => ({ TEST_USER_EMAIL: email, TEST_USER_PASSWORD: 'TEST_pass_a' }));

    // Act
    const results = envs.map((env) => runPlaywright(['test'], { config: FIXTURE_CONFIG, env }));

    // Assert: in every partition one test fails with the RF-17 message and the other passes.
    results.forEach((result, index) => {
      // The whole CLI output is the failure message, so an intermittent failure is diagnosable.
      const partition = `partition ${String(index)} (exit ${String(result.exitCode)}):\n${result.output}`;
      expect(result.output, partition).toContain(MISSING_EMAIL_MESSAGE);
      expect(result.output, partition).toMatch(/1 failed/);
      expect(result.output, partition).toMatch(/1 passed/);
    });
  });
});
