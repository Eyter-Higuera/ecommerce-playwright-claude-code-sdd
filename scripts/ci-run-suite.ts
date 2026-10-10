import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import type { EnvValues } from '../src/config/env';
import { API_PROJECT, DEFAULT_BROWSER_PROJECTS } from '../src/config/playwright-options';

// Manual run selector (Spec 000, RF-60 to RF-63 and RF-90): `npm run ci:run-suite` reads SUITE,
// BROWSER and LAYER (the GitHub Actions workflow_dispatch inputs, or the VS Code task pickers),
// validates them, runs the unit tests when the layer includes them, checks the Playwright selection
// is not empty, then runs Playwright. msedge is not allowed in CI (spec: local only).

export const SUITE_TAGS = { smoke: '@smoke', regression: '@regression' } as const;
export const ALL_BROWSERS = 'all';
/** RF-90: `all` = unit, then api and ui; `unit`, `api` and `ui` run one layer only. */
export const LAYERS = ['all', 'unit', 'api', 'ui'] as const;
const DEFAULT_LAYER = 'all';
/** RF-96: Vitest arguments of the unit layer; the JSON results are what `report:failures` reads. */
export const UNIT_RUN_ARGS = ['run', '--reporter=default', '--reporter=json', '--outputFile.json=reports/unit-results.json'] as const;
const ALLOWED_SUITES = Object.keys(SUITE_TAGS);
const ALLOWED_BROWSERS = [...DEFAULT_BROWSER_PROJECTS, ALL_BROWSERS];
const SUCCESS = 0;
const FAILURE = 1;

/** What to run: the unit tests and/or Playwright with `args` (absent when no Playwright layer is selected). */
export type Selection = { ok: true; unit: boolean; args?: string[] } | { ok: false; error: string };

export interface SuiteRunner {
  /** Runs the Vitest unit tests and returns their exit code. */
  runUnit(): number;
  /** Number of tests Playwright would run with these arguments. */
  listTests(args: string[]): number;
  /** Runs Playwright with these arguments and returns its exit code. */
  runTests(args: string[]): number;
}

function invalid(variable: string, value: string | undefined, allowed: readonly string[]): Selection {
  return { ok: false, error: `Unsupported ${variable}="${value ?? ''}": allowed values are ${allowed.join(', ')}` };
}

/** RF-60 / RF-61 / RF-62 / RF-90: what SUITE × BROWSER × LAYER runs, or the reason they are invalid. */
export function selectRun(env: EnvValues): Selection {
  const suite = env.SUITE;
  const browser = env.BROWSER;
  const layer = env.LAYER ?? DEFAULT_LAYER;
  if (suite === undefined || !ALLOWED_SUITES.includes(suite)) return invalid('SUITE', suite, ALLOWED_SUITES);
  if (browser === undefined || !ALLOWED_BROWSERS.includes(browser)) return invalid('BROWSER', browser, ALLOWED_BROWSERS);
  if (!(LAYERS as readonly string[]).includes(layer)) return invalid('LAYER', layer, LAYERS);
  const unit = layer === 'all' || layer === 'unit';
  if (layer === 'unit') return { ok: true, unit };
  const browsers = browser === ALL_BROWSERS ? [...DEFAULT_BROWSER_PROJECTS] : [browser];
  // API tests run once whatever BROWSER is (RF-61), and only for the api and all layers (RF-90).
  const projects = [...(layer === 'ui' ? [] : [API_PROJECT]), ...(layer === 'api' ? [] : browsers)];
  return { ok: true, unit, args: ['--grep', SUITE_TAGS[suite as keyof typeof SUITE_TAGS], ...projects.map((name) => `--project=${name}`)] };
}

/** RF-63 / RF-90: validates, runs the unit tests first (a failure stops the rest), refuses an empty selection, then runs. */
export function runSuite(env: EnvValues, runner: SuiteRunner): { exitCode: number; output: string[] } {
  const selection = selectRun(env);
  if (!selection.ok) return { exitCode: FAILURE, output: [selection.error] };
  const output: string[] = [];
  if (selection.unit) {
    const unitExit = runner.runUnit();
    if (unitExit !== SUCCESS) {
      const reason = selection.args === undefined ? 'Unit tests failed' : 'Unit tests failed: the API and UI tests were not run';
      return { exitCode: unitExit, output: [reason] };
    }
    output.push('Unit tests passed');
  }
  if (selection.args === undefined) return { exitCode: SUCCESS, output };
  const count = runner.listTests(selection.args);
  if (count === 0) return { exitCode: FAILURE, output: [...output, `No tests found for SUITE=${env.SUITE ?? ''}`] };
  output.push(`Running ${String(count)} test(s): ${selection.args.join(' ')}`);
  return { exitCode: runner.runTests(selection.args), output };
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
  const vitest = join('node_modules', 'vitest', 'vitest.mjs');
  const playwright = (args: string[], capture: boolean) =>
    spawnSync(process.execPath, [cli, 'test', ...args], { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  const runner: SuiteRunner = {
    runUnit: () => spawnSync(process.execPath, [vitest, ...UNIT_RUN_ARGS], { stdio: 'inherit' }).status ?? FAILURE,
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
