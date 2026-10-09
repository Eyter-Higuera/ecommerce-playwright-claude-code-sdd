import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEST_RESULTS_DIR, buildPlaywrightConfig } from '../../../src/config/playwright-options';
import { CLI_TEST_TIMEOUT_MS, fixturePath, makeEmptyDir, runPlaywright } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-25 / RF-49: API tests never record traces (a trace would
// hold the login request body with the password), while UI projects record a trace on the first
// retry so a flaky failure can be investigated.
const ARGV_WITH_EDGE = ['node', 'playwright', 'test', '--project=msedge'];
const UI_PROJECTS = ['chromium', 'firefox', 'webkit', 'msedge'];
const TRACE_FILE = 'trace.zip';

/** Paths (relative to the folder) of every trace archive under a folder. */
function traceFiles(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((path) => path.endsWith(TRACE_FILE))
    .map((path) => relative(folder, join(folder, path)).replaceAll('\\', '/'));
}

describe('Tracing — security', () => {
  it('TC-000-40 tracing is off for api and on-first-retry for UI projects', () => {
    // Arrange: msedge requested explicitly, so all five projects exist in the resolved config.
    const config = buildPlaywrightConfig({}, ARGV_WITH_EDGE);

    // Act
    const traceByProject = Object.fromEntries(
      (config.projects ?? []).map((project): [string, unknown] => [project.name ?? '', project.use?.trace]),
    );

    // Assert: api off; every UI project traces on the first retry.
    expect(traceByProject).toEqual({
      api: 'off',
      ...Object.fromEntries(UI_PROJECTS.map((name) => [name, 'on-first-retry'])),
    });
  });

  it('TC-000-41 retried runs keep UI traces and record none for api', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a fixture project built with the real config builder, in CI mode (retries on):
    // an api test and a UI test that fail once then pass, and a UI test that passes at once.
    const outputDir = makeEmptyDir();
    const config = fixturePath('playwright', 'retry-trace', 'playwright.config.ts');

    // Act
    const result = runPlaywright(['test', '--project=api', '--project=chromium'], {
      config,
      env: { CI: 'true', FIXTURE_OUTPUT_DIR: outputDir },
    });
    const traces = traceFiles(join(outputDir, TEST_RESULTS_DIR));

    // Assert: the run is green (both retries passed); exactly one trace exists, kept although the
    // retry passed, for the retried UI test on its first retry; none for api or the stable UI test.
    expect(result.exitCode, result.output).toBe(0);
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatch(/ui-fails-once-chromium-retry1\/trace\.zip$/);
  });
});
