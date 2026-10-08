import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPlaywrightConfig } from '../../../src/config/playwright-options';
import { CLI_TEST_TIMEOUT_MS, fixturePath, makeEmptyDir, runPlaywright } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-46 to RF-48: every Playwright run writes an HTML report to
// playwright-report/ and a JUnit report to reports/junit.xml (GitLab reads that path), and only CI
// retries failed tests (2 times), so local failures are never hidden by a retry.
const DEFAULT_ARGV = ['node', 'playwright', 'test'];
const HTML_REPORT_DIR = 'playwright-report';
const JUNIT_REPORT_FILE = 'reports/junit.xml';
const CI_RETRIES = 2;

/** Options of one reporter in the resolved config, or undefined when it is not configured. */
function reporterOptions(env: Record<string, string | undefined>, name: string): unknown {
  const { reporter } = buildPlaywrightConfig(env, DEFAULT_ARGV);
  if (!Array.isArray(reporter)) throw new Error('Expected a list of reporters');
  const entry = reporter.find(([reporterName]) => reporterName === name);
  return entry?.[1];
}

describe('Reporters and retries — positive', () => {
  it('TC-000-69 HTML and JUnit reporters write to the agreed paths', () => {
    // Arrange: a local run (no CI variable).
    const env = {};

    // Act
    const html = reporterOptions(env, 'html');
    const junit = reporterOptions(env, 'junit');

    // Assert: both reporters are configured, at the paths CI publishes.
    expect(html).toMatchObject({ outputFolder: HTML_REPORT_DIR });
    expect(junit).toMatchObject({ outputFile: JUNIT_REPORT_FILE });
  });

  it('TC-000-71 CI=true enables 2 retries', () => {
    // Arrange
    const env = { CI: 'true' };

    // Act
    const config = buildPlaywrightConfig(env, DEFAULT_ARGV);

    // Assert
    expect(config.retries).toBe(CI_RETRIES);
  });
});

describe('Reporters and retries — boundary', () => {
  it('TC-000-72 retries stay off when CI is unset or false', () => {
    // Arrange: the two non-CI partitions, unset and explicitly false.
    const envs = [{}, { CI: 'false' }];

    // Act
    const retries = envs.map((env) => buildPlaywrightConfig(env, DEFAULT_ARGV).retries);

    // Assert: a local failure is reported at once, never retried.
    expect(retries).toEqual([0, 0]);
  });
});

describe('Reporters and retries — negative', () => {
  it('TC-000-70 reports are produced when a test fails', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a fixture project built with the real config builder, whose only test fails;
    // its reports go to a temp folder.
    const outputDir = makeEmptyDir();
    const config = fixturePath('playwright', 'failing', 'playwright.config.ts');

    // Act: a local run (no CI variable, so no retry).
    const result = runPlaywright(['test', '--project=api'], { config, env: { FIXTURE_OUTPUT_DIR: outputDir } });

    // Assert: the run fails, and both reports exist with the failure recorded — a failing run is
    // exactly when the evidence is needed.
    expect(result.exitCode).not.toBe(0);
    expect(existsSync(join(outputDir, HTML_REPORT_DIR, 'index.html'))).toBe(true);
    expect(readFileSync(join(outputDir, JUNIT_REPORT_FILE), 'utf8')).toMatch(/failures="1"/);
  });
});
