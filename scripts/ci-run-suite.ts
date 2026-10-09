import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import type { EnvValues } from '../src/config/env';
import { API_PROJECT, DEFAULT_BROWSER_PROJECTS } from '../src/config/playwright-options';

// Manual run selector (Spec 000, RF-60 to RF-63): `npm run ci:run-suite` reads SUITE and BROWSER
// (the GitHub Actions workflow_dispatch inputs), validates them, checks the selection is not empty, then runs
// Playwright. msedge is not allowed in CI (spec: local only).

export const SUITE_TAGS = { smoke: '@smoke', regression: '@regression' } as const;
export const ALL_BROWSERS = 'all';
const ALLOWED_SUITES = Object.keys(SUITE_TAGS);
const ALLOWED_BROWSERS = [...DEFAULT_BROWSER_PROJECTS, ALL_BROWSERS];
const SUCCESS = 0;
const FAILURE = 1;

export type Selection = { ok: true; args: string[] } | { ok: false; error: string };

export interface SuiteRunner {
  /** Number of tests Playwright would run with these arguments. */
  listTests(args: string[]): number;
  /** Runs Playwright with these arguments and returns its exit code. */
  runTests(args: string[]): number;
}

function invalid(variable: string, value: string | undefined, allowed: readonly string[]): Selection {
  return { ok: false, error: `Unsupported ${variable}="${value ?? ''}": allowed values are ${allowed.join(', ')}` };
}

/** RF-60 / RF-61 / RF-62: Playwright arguments for SUITE × BROWSER, or the reason they are invalid. */
export function selectRun(env: EnvValues): Selection {
  const suite = env.SUITE;
  const browser = env.BROWSER;
  if (suite === undefined || !ALLOWED_SUITES.includes(suite)) return invalid('SUITE', suite, ALLOWED_SUITES);
  if (browser === undefined || !ALLOWED_BROWSERS.includes(browser)) return invalid('BROWSER', browser, ALLOWED_BROWSERS);
  const browsers = browser === ALL_BROWSERS ? [...DEFAULT_BROWSER_PROJECTS] : [browser];
  return {
    ok: true,
    // API tests run once whatever BROWSER is (RF-61).
    args: ['--grep', SUITE_TAGS[suite as keyof typeof SUITE_TAGS], `--project=${API_PROJECT}`, ...browsers.map((name) => `--project=${name}`)],
  };
}

/** RF-63: validates, refuses an empty selection, then runs. */
export function runSuite(env: EnvValues, runner: SuiteRunner): { exitCode: number; output: string[] } {
  const selection = selectRun(env);
  if (!selection.ok) return { exitCode: FAILURE, output: [selection.error] };
  const count = runner.listTests(selection.args);
  if (count === 0) return { exitCode: FAILURE, output: [`No tests found for SUITE=${env.SUITE ?? ''}`] };
  return { exitCode: runner.runTests(selection.args), output: [`Running ${String(count)} test(s): ${selection.args.join(' ')}`] };
}

interface JsonSuite {
  specs?: { tests?: unknown[] }[];
  suites?: JsonSuite[];
}

/** Number of tests in the output of `playwright test --list --reporter=json`. */
export function countListedTests(listJson: string): number {
  const count = (suite: JsonSuite): number =>
    (suite.specs ?? []).reduce((sum, spec) => sum + (spec.tests?.length ?? 0), 0) + (suite.suites ?? []).reduce((sum, child) => sum + count(child), 0);
  return count(JSON.parse(listJson) as JsonSuite);
}

function main(): void {
  const cli = join('node_modules', '@playwright', 'test', 'cli.js');
  const playwright = (args: string[], capture: boolean) =>
    spawnSync(process.execPath, [cli, 'test', ...args], { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  const runner: SuiteRunner = {
    listTests: (args) => {
      const listing = playwright(['--list', '--reporter=json', ...args], true);
      // Playwright exits non-zero with "No tests found"; that is a count of 0.
      return listing.stdout.trim().startsWith('{') ? countListedTests(listing.stdout) : 0;
    },
    runTests: (args) => playwright(args, false).status ?? FAILURE,
  };
  const result = runSuite(process.env, runner);
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode === SUCCESS ? SUCCESS : result.exitCode;
}

if (require.main === module) main();
