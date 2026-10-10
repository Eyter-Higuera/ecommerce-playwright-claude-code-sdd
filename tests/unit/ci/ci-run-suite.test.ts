import { describe, expect, it, vi } from 'vitest';
import { runSuite, selectRun } from '../../../scripts/ci-run-suite';

// Spec 000 — Framework foundation. RF-60 to RF-63 and RF-90: a manual run picks the suite (SUITE),
// the browsers (BROWSER) and the layer (LAYER: all, unit, api, ui); the selector turns them into a
// unit run and Playwright arguments, rejects unsupported values naming the allowed ones, and refuses
// to pass with zero selected tests. Runners are stubs: nothing is really run.
const SUITES = { smoke: '@smoke', regression: '@regression' } as const;
const SINGLE_BROWSERS = ['chromium', 'firefox', 'webkit'] as const;
const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;
const LISTED_TESTS = 3;

/** Stub runners: the unit run exits with `unitExit`; Playwright lists LISTED_TESTS tests and passes. */
function stubRunner(unitExit = SUCCESS_EXIT_CODE) {
  return {
    runUnit: vi.fn().mockReturnValue(unitExit),
    listTests: vi.fn().mockReturnValue(LISTED_TESTS),
    runTests: vi.fn().mockReturnValue(SUCCESS_EXIT_CODE),
  };
}

describe('CI suite selector — layers (RF-90)', () => {
  it('TC-000-137 manual-run selector picks the projects of each layer', () => {
    // Arrange: one combination per layer that runs Playwright.
    const cases = [
      { env: { SUITE: 'smoke', BROWSER: 'chromium', LAYER: 'api' }, unit: false, projects: ['api'] },
      { env: { SUITE: 'smoke', BROWSER: 'chromium', LAYER: 'ui' }, unit: false, projects: ['chromium'] },
      { env: { SUITE: 'smoke', BROWSER: 'all', LAYER: 'ui' }, unit: false, projects: [...SINGLE_BROWSERS] },
      { env: { SUITE: 'smoke', BROWSER: 'firefox', LAYER: 'all' }, unit: true, projects: ['api', 'firefox'] },
      { env: { SUITE: 'smoke', BROWSER: 'firefox' }, unit: true, projects: ['api', 'firefox'] },
    ];

    // Act
    const selections = cases.map(({ env }) => selectRun(env));

    // Assert: each layer selects only its projects; `all` (also when LAYER is unset) adds the unit tests.
    selections.forEach((selection, index) => {
      const { unit, projects } = cases[index] ?? { unit: false, projects: [] };
      expect(selection).toEqual({ ok: true, unit, args: ['--grep', '@smoke', ...projects.map((name) => `--project=${name}`)] });
    });
  });

  it('TC-000-138 LAYER=unit runs only the unit tests', () => {
    // Arrange: the unit run passes, then fails.
    const passing = stubRunner(SUCCESS_EXIT_CODE);
    const failing = stubRunner(FAILURE_EXIT_CODE);
    const env = { SUITE: 'smoke', BROWSER: 'chromium', LAYER: 'unit' };

    // Act
    const passed = runSuite(env, passing);
    const failed = runSuite(env, failing);

    // Assert: Vitest runs once and its exit code is the result; Playwright is never listed or run.
    expect(selectRun(env)).toEqual({ ok: true, unit: true });
    expect(passed.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(failed.exitCode).toBe(FAILURE_EXIT_CODE);
    for (const runner of [passing, failing]) {
      expect(runner.runUnit).toHaveBeenCalledTimes(1);
      expect(runner.listTests).not.toHaveBeenCalled();
      expect(runner.runTests).not.toHaveBeenCalled();
    }
  });

  it('TC-000-139 an unsupported LAYER is refused naming the allowed values', () => {
    // Arrange: an unknown layer and a wrong-case one.
    const invalid = ['e2e', 'API'];
    const runner = stubRunner();

    // Act
    const results = invalid.map((layer) => runSuite({ SUITE: 'smoke', BROWSER: 'chromium', LAYER: layer }, runner));

    // Assert: refused before anything runs, naming LAYER and its allowed values.
    results.forEach((result, index) => {
      expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
      expect(result.output).toContain(`Unsupported LAYER="${invalid[index] ?? ''}": allowed values are all, unit, api, ui`);
    });
    expect(runner.runUnit).not.toHaveBeenCalled();
    expect(runner.listTests).not.toHaveBeenCalled();
  });

  it('TC-000-140 LAYER=all stops before Playwright when the unit tests fail', () => {
    // Arrange: failing unit tests.
    const runner = stubRunner(FAILURE_EXIT_CODE);

    // Act
    const result = runSuite({ SUITE: 'regression', BROWSER: 'webkit', LAYER: 'all' }, runner);

    // Assert: the API and UI tests never start (RF-90).
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toContain('Unit tests failed: the API and UI tests were not run');
    expect(runner.listTests).not.toHaveBeenCalled();
    expect(runner.runTests).not.toHaveBeenCalled();
  });
});

describe('CI suite selector — positive', () => {
  it('TC-000-90 SUITE and BROWSER values select the right tests', () => {
    // Arrange: every valid combination (2 suites × 4 browser values).
    const combinations = Object.keys(SUITES).flatMap((suite) => [...SINGLE_BROWSERS, 'all'].map((browser) => ({ suite, browser })));

    // Act
    const selections = combinations.map(({ suite, browser }) => ({ suite, browser, result: selectRun({ SUITE: suite, BROWSER: browser }) }));

    // Assert: the suite's tag is grepped; the browser projects match BROWSER (all = the three);
    // the api project is included exactly once; LAYER unset means all, so the unit tests run too.
    for (const { suite, browser, result } of selections) {
      const expectedBrowsers = browser === 'all' ? [...SINGLE_BROWSERS] : [browser];
      expect(result).toEqual({
        ok: true,
        unit: true,
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
    const result = runSuite({ SUITE: 'regression', BROWSER: 'chromium', LAYER: 'api' }, { listTests, runTests, runUnit: vi.fn() });

    // Assert: an empty suite is a failure with the spec's message, and Playwright is not run.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toContain('No tests found for SUITE=regression');
    expect(runTests).not.toHaveBeenCalled();
  });
});
