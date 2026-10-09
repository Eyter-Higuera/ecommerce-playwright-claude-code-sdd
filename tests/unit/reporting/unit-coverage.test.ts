import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runSummary, type StageSummary } from '../../../scripts/test-summary';
import { REPO_ROOT, fixturePath, makeEmptyDir } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-85: the CI unit-test job measures the code coverage of `src/`
// and `scripts/`, reports it in the job summary even when tests fail, keeps the HTML report in
// `reports/coverage/`, and never fails the job on a coverage threshold. vitest.config.mts is read as
// text: Vitest cannot import its own config module inside a test.
const VITEST_RESULTS = fixturePath('reports', 'summary', 'vitest-results.json');
const COVERAGE_SUMMARY = fixturePath('reports', 'summary', 'coverage-summary.json');
const COVERAGE_HEADER = '| Lines | Branches | Functions | Statements |';
/** The `coverage: { … }` object of vitest.config.mts, up to its closing brace at 4 spaces. */
const COVERAGE_BLOCK = /coverage: \{([\s\S]*?)\n {4}\}/;

interface PackageJson {
  version?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const readPackage = (path: string): PackageJson => JSON.parse(readFileSync(path, 'utf8')) as PackageJson;

describe('Unit coverage — positive', () => {
  it('TC-000-123 unit summary adds code coverage only when a coverage summary exists', () => {
    // Arrange: the same Vitest results, with and without a coverage summary.
    const dir = makeEmptyDir('TEST_coverage_');
    const missingCoverage = join(dir, 'no-coverage-summary.json');

    // Act
    const withCoverage = runSummary({ stage: 'Unit', reportPath: VITEST_RESULTS, coveragePath: COVERAGE_SUMMARY, summaryJsonPath: join(dir, 'with.json') });
    const withoutCoverage = runSummary({ stage: 'Unit', reportPath: VITEST_RESULTS, coveragePath: missingCoverage, summaryJsonPath: join(dir, 'without.json') });

    // Assert: the totals, with two decimals, follow the test table; no coverage file, no table and no error.
    expect(withCoverage.output).toContain(COVERAGE_HEADER);
    expect(withCoverage.output).toContain('| 91.25 % | 80.00 % | 88.50 % | 90.75 % |');
    expect((JSON.parse(readFileSync(join(dir, 'with.json'), 'utf8')) as StageSummary).coverage).toEqual({ lines: 91.25, branches: 80, functions: 88.5, statements: 90.75 });
    expect(withoutCoverage.exitCode).toBe(0);
    expect(withoutCoverage.output).not.toContain(COVERAGE_HEADER);
    expect(withoutCoverage.summary.coverage).toBeUndefined();
  });

  it('TC-000-124 unit coverage covers src and scripts with no threshold', () => {
    // Arrange
    const manifest = readPackage(join(REPO_ROOT, 'package.json'));
    const installedVitest = readPackage(join(REPO_ROOT, 'node_modules', 'vitest', 'package.json')).version;

    // Act
    const coverage = COVERAGE_BLOCK.exec(readFileSync(join(REPO_ROOT, 'vitest.config.mts'), 'utf8'))?.[1] ?? '';
    const ciScript = manifest.scripts?.['test:unit:ci'] ?? '';

    // Assert: v8 provider pinned to the installed Vitest; src and scripts measured; a JSON summary
    // for the job summary and an HTML report for the artifacts, also on failure; no thresholds.
    expect(manifest.devDependencies?.['@vitest/coverage-v8']).toBe(installedVitest);
    for (const setting of [
      "provider: 'v8'",
      "include: ['src/**', 'scripts/**']",
      "reportsDirectory: 'reports/coverage'",
      'reportOnFailure: true',
    ]) expect(coverage, setting).toContain(setting);
    const reporters = /reporter: \[([^\]]*)\]/.exec(coverage)?.[1] ?? '';
    expect(reporters).toContain("'json-summary'");
    expect(reporters).toContain("'html'");
    expect(coverage).not.toContain('thresholds');
    // CI writes JSON results for the summary; the local command stays as it was.
    for (const part of ['vitest run', '--coverage', '--reporter=json', '--outputFile.json=reports/unit-results.json']) expect(ciScript, part).toContain(part);
    expect(manifest.scripts?.['test:unit']).toBe('vitest run');
  });
});
