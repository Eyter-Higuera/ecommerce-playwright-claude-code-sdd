import { describe, expect, it, vi } from 'vitest';
import { runSuite, selectRun } from '../../../scripts/ci-run-suite';

// Spec 000 — Framework foundation. RF-60 to RF-63: a manual pipeline picks the suite (SUITE) and
// the browsers (BROWSER); the selector turns them into Playwright arguments, rejects unsupported
// values naming the allowed ones, and refuses to pass with zero selected tests.
const SUITES = { smoke: '@smoke', regression: '@regression' } as const;
const SINGLE_BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const SUCCESS_EXIT_CODE = 0;

describe('CI suite selector — positive', () => {
  it('TC-000-90 SUITE and BROWSER values select the right tests', () => {
    // Arrange: every valid combination (2 suites × 4 browser values).
    const combinations = Object.keys(SUITES).flatMap((suite) => [...SINGLE_BROWSERS, 'all'].map((browser) => ({ suite, browser })));

    // Act
    const selections = combinations.map(({ suite, browser }) => ({ suite, browser, result: selectRun({ SUITE: suite, BROWSER: browser }) }));

    // Assert: the suite's tag is grepped; the browser projects match BROWSER (all = the three);
    // the api project is always included exactly once.
    for (const { suite, browser, result } of selections) {
      const expectedBrowsers = browser === 'all' ? [...SINGLE_BROWSERS] : [browser];
      expect(result).toEqual({
        ok: true,
        args: ['--grep', SUITES[suite as keyof typeof SUITES], '--project=api', ...expectedBrowsers.map((name) => `--project=${name}`)],
      });
    }
  });
});

describe('CI suite selector — negative', () => {
  it('TC-000-91 unsupported SUITE or BROWSER fails naming allowed values', () => {
    // Arrange: msedge (local only), empty, wrong case and unknown values.
    const invalid = [
      { env: { SUITE: 'smoke', BROWSER: 'msedge' }, variable: 'BROWSER', allowed: 'chromium, firefox, webkit, all' },
      { env: { SUITE: 'smoke', BROWSER: '' }, variable: 'BROWSER', allowed: 'chromium, firefox, webkit, all' },
      { env: { SUITE: 'Smoke', BROWSER: 'chromium' }, variable: 'SUITE', allowed: 'smoke, regression' },
      { env: { SUITE: 'TEST_suite', BROWSER: 'chromium' }, variable: 'SUITE', allowed: 'smoke, regression' },
    ];

    // Act
    const results = invalid.map(({ env }) => selectRun(env));

    // Assert: each is rejected, naming the variable and its allowed values.
    results.forEach((result, index) => {
      const { variable, allowed } = invalid[index] ?? { variable: '', allowed: '' };
      expect(result.ok).toBe(false);
      expect(result.ok ? '' : result.error).toContain(variable);
      expect(result.ok ? '' : result.error).toContain(allowed);
    });
  });

  it('TC-000-92 a suite with zero tests fails the pipeline', () => {
    // Arrange: a valid selection whose listing finds no test (stubbed), so nothing would run.
    const listTests = vi.fn().mockReturnValue(0);
    const runTests = vi.fn().mockReturnValue(SUCCESS_EXIT_CODE);

    // Act
    const result = runSuite({ SUITE: 'regression', BROWSER: 'chromium' }, { listTests, runTests });

    // Assert: an empty suite is a failure with the spec's message, and Playwright is not run.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toContain('No tests found for SUITE=regression');
    expect(runTests).not.toHaveBeenCalled();
  });
});
