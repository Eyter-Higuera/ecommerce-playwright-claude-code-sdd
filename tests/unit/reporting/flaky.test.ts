import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { flakySummary } from '../../../scripts/flaky-summary';
import { readZipEntries } from '../../../scripts/lib/zip-reader';
import { HTML_REPORT_DIR, JSON_REPORT_FILE, JUNIT_REPORT_FILE } from '../../../src/config/playwright-options';
import { CLI_TEST_TIMEOUT_MS, fixturePath, makeEmptyDir, runPlaywright } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-50 / RF-51: a test that passes only on retry is flaky; the
// reports must say so (so flakiness is investigated, not hidden by retries) and CI prints the
// count. Fixture projects use the real config builder and fixtures, in CI mode (retries on).
const FLAKY_PROPERTY = /<property name="flaky" value="passed on retry 1">/;
const HTML_PAYLOAD = /<template id="playwrightReportBase64">data:application\/zip;base64,([^<]+)<\/template>/;
const FLAKY_OUTCOME = '"outcome":"flaky"';

function runFixture(name: string): string {
  const outputDir = makeEmptyDir();
  runPlaywright(['test', '--project=api'], {
    config: fixturePath('playwright', name, 'playwright.config.ts'),
    env: { CI: 'true', FIXTURE_OUTPUT_DIR: outputDir },
  });
  return outputDir;
}

/** The HTML report embeds its data as a base64 zip; returns the text of every entry. */
function htmlReportData(outputDir: string): string {
  const html = readFileSync(join(outputDir, HTML_REPORT_DIR, 'index.html'), 'utf8');
  const payload = HTML_PAYLOAD.exec(html)?.[1];
  if (payload === undefined) throw new Error('HTML report payload not found');
  return readZipEntries(Buffer.from(payload, 'base64')).map((entry) => entry.data.toString('utf8')).join('\n');
}

describe('Flaky tests — positive', () => {
  it('TC-000-73 a test passing on retry is marked flaky', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange + Act: a test that fails once and passes on retry.
    const outputDir = runFixture('flaky');

    // Assert: both reports carry the flaky mark (HTML natively, JUnit through the annotation).
    expect(htmlReportData(outputDir)).toContain(FLAKY_OUTCOME);
    expect(readFileSync(join(outputDir, JUNIT_REPORT_FILE), 'utf8')).toMatch(FLAKY_PROPERTY);
  });

  it('TC-000-75 CI flaky summary prints the flaky count', () => {
    // Arrange: a results file with 1 flaky test out of 3.
    const results = readFileSync(fixturePath('reports', 'one-flaky-of-three.json'), 'utf8');

    // Act
    const summary = flakySummary(results);

    // Assert
    expect(summary).toBe('Flaky tests: 1');
  });
});

describe('Flaky tests — negative', () => {
  it('TC-000-74 stable tests are not flaky and the count is 0', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange + Act: a test that passes on the first attempt, then the summary of that run.
    const outputDir = runFixture('stable');
    const summary = flakySummary(readFileSync(join(outputDir, JSON_REPORT_FILE), 'utf8'));

    // Assert: no flaky mark in either report, and the printed count is 0.
    expect(htmlReportData(outputDir)).not.toContain(FLAKY_OUTCOME);
    expect(readFileSync(join(outputDir, JUNIT_REPORT_FILE), 'utf8')).not.toMatch(FLAKY_PROPERTY);
    expect(summary).toBe('Flaky tests: 0');
  });
});
