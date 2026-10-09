import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MAX_FAILED_TITLES, runSummary, type StageSummary } from '../../../scripts/test-summary';
import { fixturePath, makeEmptyDir } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-84 / RF-87: every CI test job prints, and adds to the GitHub
// job summary, the passed / failed / skipped / flaky counts, the total and the duration of its run,
// then the failed titles; a missing results file is reported, never a reason to fail. The script
// runs in-process on local fixtures; the job summary is a temporary file, as in GitHub Actions.
const PLAYWRIGHT_RESULTS = fixturePath('reports', 'summary', 'playwright-results.json');
const VITEST_RESULTS = fixturePath('reports', 'summary', 'vitest-results.json');
const EXISTING_SUMMARY_LINE = '## Earlier step';

/** Runs the summary for `reportPath` with the outputs in a fresh temp directory. */
function summarize(stage: string, reportPath: string, stepSummary?: string) {
  const dir = makeEmptyDir('TEST_summary_');
  const summaryJsonPath = join(dir, 'summary.json');
  const result = runSummary({ stage, reportPath, summaryJsonPath, stepSummaryPath: stepSummary });
  return { ...result, dir, summaryJsonPath };
}

/** A Playwright JSON report with `failed` failing tests and nothing else. */
function playwrightReportWithFailures(failed: number): string {
  const dir = makeEmptyDir('TEST_failures_');
  const path = join(dir, 'results.json');
  const specs = Array.from({ length: failed }, (_, index) => ({
    title: `TC-900-${String(index + 1).padStart(3, '0')} fails`,
    tests: [{ projectName: 'api', status: 'unexpected' }],
  }));
  writeFileSync(path, JSON.stringify({ suites: [{ title: 'many.spec.ts', specs }], stats: { duration: 1000, expected: 0, skipped: 0, unexpected: failed, flaky: 0 } }));
  return path;
}

describe('Test summary — positive', () => {
  it('TC-000-120 test summary reports a Playwright run', () => {
    // Arrange: 5 expected, 2 unexpected, 1 skipped and 1 flaky test in 83.4 s.
    const reportPath = PLAYWRIGHT_RESULTS;

    // Act
    const { exitCode, output, summaryJsonPath } = summarize('API', reportPath);

    // Assert: flaky tests count as passed and in their own column; total = passed + failed +
    // skipped; the duration is the run's wall-clock time; the failed titles follow the table.
    expect(exitCode).toBe(0);
    expect(output).toContain('| Stage | Passed | Failed | Skipped | Flaky | Total | Duration |');
    expect(output).toContain('| API | 6 | 2 | 1 | 1 | 9 | 01:23 |');
    expect(output).toContain('- TC-900-03 fails on the status code');
    expect(output).toContain('- TC-900-05 fails on the message');
    const saved = JSON.parse(readFileSync(summaryJsonPath, 'utf8')) as StageSummary;
    expect(saved).toMatchObject({ stage: 'API', known: true, passed: 6, failed: 2, skipped: 1, flaky: 1, total: 9, durationMs: 83_400 });
    expect(saved.failedTitles).toEqual(['TC-900-03 fails on the status code', 'TC-900-05 fails on the message']);
  });

  it('TC-000-121 test summary reports a Vitest run', () => {
    // Arrange: 10 passed, 1 failed, 1 pending and 1 todo test; the last file ends 65.5 s after the start.
    const reportPath = VITEST_RESULTS;

    // Act
    const { exitCode, output } = summarize('Unit', reportPath);

    // Assert: pending and todo tests are skipped; Vitest has no flaky count.
    expect(exitCode).toBe(0);
    expect(output).toContain('| Unit | 10 | 1 | 2 | 0 | 13 | 01:05 |');
    expect(output).toContain('- TC-900-11 fails on the exit code');
  });
});

describe('Test summary — boundary', () => {
  it('TC-000-122 test summary is added to the GitHub job summary only when one is available', () => {
    // Arrange: a job summary that an earlier step already wrote to.
    const stepSummary = join(makeEmptyDir('TEST_step_'), 'step-summary.md');
    writeFileSync(stepSummary, `${EXISTING_SUMMARY_LINE}\n`);

    // Act
    const withSummary = summarize('API', PLAYWRIGHT_RESULTS, stepSummary);
    const withoutSummary = summarize('API', PLAYWRIGHT_RESULTS);

    // Assert: appended after the earlier content and printed; without a job summary, printed only.
    const written = readFileSync(stepSummary, 'utf8');
    expect(written.startsWith(`${EXISTING_SUMMARY_LINE}\n`)).toBe(true);
    expect(written).toContain('| API | 6 | 2 | 1 | 1 | 9 | 01:23 |');
    expect(withSummary.output).toContain('| API | 6 | 2 | 1 | 1 | 9 | 01:23 |');
    expect(withoutSummary.output).toContain('| API | 6 | 2 | 1 | 1 | 9 | 01:23 |');
    expect(readdirSync(withoutSummary.dir)).toEqual(['summary.json']);
  });

  it('TC-000-135 test summary lists at most 50 failed titles', () => {
    // Arrange: one report at the limit and one just above it.
    const atLimit = playwrightReportWithFailures(MAX_FAILED_TITLES);
    const aboveLimit = playwrightReportWithFailures(MAX_FAILED_TITLES + 1);

    // Act
    const atLimitOutput = summarize('API', atLimit).output;
    const aboveLimitOutput = summarize('API', aboveLimit).output;

    // Assert: 50 titles and no "more" line; above the limit, 50 titles and "and 1 more".
    const titleLines = (text: string) => text.split('\n').filter((line) => line.startsWith('- TC-900-'));
    expect(MAX_FAILED_TITLES).toBe(50);
    expect(titleLines(atLimitOutput)).toHaveLength(MAX_FAILED_TITLES);
    expect(atLimitOutput).not.toContain('more');
    expect(titleLines(aboveLimitOutput)).toHaveLength(MAX_FAILED_TITLES);
    expect(aboveLimitOutput).toContain('- and 1 more');
    expect(aboveLimitOutput).not.toContain('TC-900-051');
  });
});

describe('Test summary — negative', () => {
  it('TC-000-125 test summary without a results file reports unknown results and passes', () => {
    // Arrange: the job failed before its tests wrote a results file.
    const missing = join(makeEmptyDir('TEST_missing_'), 'results.json');
    const stepSummary = join(makeEmptyDir('TEST_step_'), 'step-summary.md');

    // Act
    const { exitCode, output, summaryJsonPath } = summarize('UI chromium', missing, stepSummary);

    // Assert: reported in the log and the job summary; the summary step does not fail the job, and
    // the saved summary marks the results as unknown for the results page (RF-88).
    const message = `Results unknown (no report at ${missing})`;
    expect(exitCode).toBe(0);
    expect(output).toContain(message);
    expect(readFileSync(stepSummary, 'utf8')).toContain(message);
    expect(JSON.parse(readFileSync(summaryJsonPath, 'utf8'))).toMatchObject({ stage: 'UI chromium', known: false });
  });
});
