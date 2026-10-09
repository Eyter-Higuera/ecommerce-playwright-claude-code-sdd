import type { PlaywrightTestConfig } from '@playwright/test';
import type { EnvValues } from './env';
import { NAVIGATION_TIMEOUT_MS } from './timeouts';

// Pure builder of the Playwright configuration (Spec 000, RF-8 to RF-11, RF-25, RF-46 to RF-49).
// playwright.config.ts only wraps it, so unit tests can check the resolved settings without
// loading Playwright Test inside Vitest. Paths are relative to the repository root, where
// playwright.config.ts lives.

export const API_PROJECT = 'api';
export const DEFAULT_BROWSER_PROJECTS = ['chromium', 'firefox', 'webkit'] as const;
/** Local-only project, added only when requested with `--project=msedge` (RF-9, RF-10). */
export const EDGE_PROJECT = 'msedge';

export const HTML_REPORT_DIR = 'playwright-report';
export const JUNIT_REPORT_FILE = 'reports/junit.xml';
/** Machine-readable results; the flaky summary (RF-51) reads it. */
export const JSON_REPORT_FILE = 'reports/results.json';
export const TEST_RESULTS_DIR = 'test-results';

/** RF-47: retries in CI only. */
export const CI_RETRIES = 2;
const LOCAL_RETRIES = 0;

const TESTS_DIR = './tests';
const API_SUBDIR = 'api';
// Browser projects run the real UI tests and the mocked UI tests (page.route()).
const UI_TEST_MATCH = /[\\/](ui|mocked)[\\/].*\.spec\.ts$/;
// tests/fixtures/ holds fixture projects for unit tests (some have ui/ folders); the real run
// must never collect them.
const FIXTURES_IGNORE = /[\\/]tests[\\/]fixtures[\\/]/;

/** RF-47 / RF-48: only `CI=true` enables retries. */
export function resolveRetries(env: EnvValues): number {
  return env.CI === 'true' ? CI_RETRIES : LOCAL_RETRIES;
}

/** True when the Playwright CLI arguments explicitly select a project (`--project=x` or `--project x`). */
export function isProjectRequested(argv: readonly string[], projectName: string): boolean {
  return argv.some((arg, index) => arg === `--project=${projectName}` || (arg === '--project' && argv[index + 1] === projectName));
}

type ProjectConfig = NonNullable<PlaywrightTestConfig['projects']>[number];

/**
 * Only for fixture projects in unit tests: run fixture tests with the real settings, and write
 * reports and artifacts to a temporary folder instead of the repository.
 */
export interface BuildOptions {
  /** Folder holding `api/`, `ui/` and `mocked/` test folders. Default: `./tests`. */
  testsDir?: string;
  /** Root for test-results/, playwright-report/ and reports/. Default: the config folder. */
  outputDir?: string;
}

/** Joins with `/`; Playwright accepts forward slashes on every OS. */
const under = (root: string | undefined, path: string): string => (root === undefined ? path : `${root}/${path}`);

function browserProjects(argv: readonly string[], testsDir: string, testIgnore: RegExp | undefined): ProjectConfig[] {
  const projects: ProjectConfig[] = DEFAULT_BROWSER_PROJECTS.map((browserName) => ({
    name: browserName,
    testDir: testsDir,
    testMatch: UI_TEST_MATCH,
    ...(testIgnore && { testIgnore }),
    use: { browserName, trace: 'on-first-retry' },
  }));
  if (isProjectRequested(argv, EDGE_PROJECT)) {
    projects.push({
      name: EDGE_PROJECT,
      testDir: testsDir,
      testMatch: UI_TEST_MATCH,
      ...(testIgnore && { testIgnore }),
      use: { browserName: 'chromium', channel: 'msedge', trace: 'on-first-retry' },
    });
  }
  return projects;
}

export function buildPlaywrightConfig(env: EnvValues, argv: readonly string[], options: BuildOptions = {}): PlaywrightTestConfig {
  const testsDir = options.testsDir ?? TESTS_DIR;
  const { outputDir } = options;
  // A fixture project lives inside tests/fixtures/, so the ignore applies to the real run only.
  const testIgnore = options.testsDir === undefined ? FIXTURES_IGNORE : undefined;
  return {
    testDir: testsDir,
    outputDir: under(outputDir, TEST_RESULTS_DIR),
    fullyParallel: true,
    forbidOnly: env.CI === 'true',
    retries: resolveRetries(env),
    reporter: [
      ['list'],
      ['html', { outputFolder: under(outputDir, HTML_REPORT_DIR), open: 'never' }],
      // embedAnnotationsAsProperties: the flaky annotation (RF-50) becomes a JUnit <property>.
      ['junit', { outputFile: under(outputDir, JUNIT_REPORT_FILE), embedAnnotationsAsProperties: true }],
      ['json', { outputFile: under(outputDir, JSON_REPORT_FILE) }],
    ],
    use: {
      navigationTimeout: NAVIGATION_TIMEOUT_MS,
    },
    projects: [
      // RF-11 / RF-25: API tests run once, without a browser, and never record a trace, because a
      // trace would contain the login request body with the password.
      { name: API_PROJECT, testDir: `${testsDir}/${API_SUBDIR}`, use: { trace: 'off' } },
      ...browserProjects(argv, testsDir, testIgnore),
    ],
  };
}
