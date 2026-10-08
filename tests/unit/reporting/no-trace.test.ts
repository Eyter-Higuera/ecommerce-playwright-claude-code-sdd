import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEST_RESULTS_DIR } from '../../../src/config/playwright-options';
import { CLI_TEST_TIMEOUT_MS, fixturePath, makeEmptyDir, runPlaywright } from '../helpers/run-cli';

// Spec 001 — Authentication. RF-27: tests that type a real password (or hold an auth token) into
// the browser record no trace, retries included, while every other UI test keeps the Spec 000
// RF-49 trace on its first retry. A fixture project built with the real config builder and the real
// fixtures runs in CI mode (retries on); its UI tests use page.setContent only, so nothing reaches
// the network, and the "real" credentials are TEST_ values given through the child environment.
const FIXTURE_CONFIG = fixturePath('playwright', 'no-trace', 'playwright.config.ts');
const FIXTURE_CREDENTIALS = { TEST_USER_EMAIL: 'TEST_fixture@example.test', TEST_USER_PASSWORD: 'TEST_fixture_pass' };
const TRACE_FILE = 'trace.zip';
const MARKED_TEST = 'password test fails once';
const UNMARKED_TEST = 'normal test fails once';

/** Folder names (relative to test-results/) that hold a trace archive. */
function foldersWithTrace(outputDir: string): string[] {
  const resultsDir = join(outputDir, TEST_RESULTS_DIR);
  return readdirSync(resultsDir, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith(TRACE_FILE))
    .map((path) => path.replaceAll('\\', '/'));
}

/** Runs one fixture test on chromium in CI mode and returns the exit code and trace folders. */
function runFixtureTest(title: string): { exitCode: number | null; output: string; traces: string[] } {
  const outputDir = makeEmptyDir();
  const result = runPlaywright(['test', '--project=chromium', '--grep', title], {
    config: FIXTURE_CONFIG,
    env: { CI: 'true', FIXTURE_OUTPUT_DIR: outputDir, ...FIXTURE_CREDENTIALS },
  });
  return { exitCode: result.exitCode, output: result.output, traces: foldersWithTrace(outputDir) };
}

describe('Secret-safe tracing — security', () => {
  it('TC-001-37 tests typing a real password record no trace, even on retry', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: the marked test (test.use(NO_TRACE)) types the account A password from the
    // formAccountA fixture, fails on its first attempt and passes on its first retry.

    // Act
    const run = runFixtureTest(MARKED_TEST);

    // Assert: the run is green, so the retry really happened and passed, and no trace exists at
    // all, neither for the failed attempt nor for the retry.
    expect(run.exitCode, run.output).toBe(0);
    expect(run.traces).toEqual([]);
  });
});

describe('Secret-safe tracing — negative', () => {
  it('TC-001-38 other UI tests still record a trace on first retry', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: an unmarked UI test that holds no secret fails once, then passes.

    // Act
    const run = runFixtureTest(UNMARKED_TEST);

    // Assert: Spec 000 RF-49 still applies to it: exactly one trace, for its first retry.
    expect(run.exitCode, run.output).toBe(0);
    expect(run.traces).toHaveLength(1);
    expect(run.traces[0]).toMatch(/normal-test-fails-once-chromium-retry1\/trace\.zip$/);
  });
});
