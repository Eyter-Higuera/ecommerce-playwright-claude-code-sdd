import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { UNIT_RUN_ARGS } from '../../../scripts/ci-run-suite';
import { GITHUB_LOG_LINES, failureReport, type GhRunner } from '../../../scripts/failure-report';
import { REPO_ROOT, fixturePath, makeEmptyDir } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-96: `npm run report:failures` lists the failed tests of the
// latest local results (Playwright and Vitest) or the failed jobs of a GitHub run, so the user and
// `/fix-failure` see why a manual test failed; secrets are redacted and the command never fails.
// Each test builds a temporary repository root; `gh` is a stub runner (no network, no CLI).
const PLAYWRIGHT_FIXTURE = fixturePath('reports', 'failures', 'playwright-results.json');
const VITEST_FIXTURE = fixturePath('reports', 'failures', 'unit-results.json');
const PASSING_PLAYWRIGHT = fixturePath('reports', 'one-flaky-of-three.json');
const SUCCESS_EXIT_CODE = 0;
const FAKE_PASSWORD = 'TEST_secret_pass_7781';
const FAKE_JWT = 'eyJTESTheader0001.eyJTESTpayload0001.TESTsignature0001';
const NO_FAILURES = 'No failed tests found in reports/results.json, reports/unit-results.json';
const GH_LOG_TOTAL_LINES = 60;
const ANSI_RED = `${String.fromCharCode(27)}[31m`;
const ANSI_RESET = `${String.fromCharCode(27)}[39m`;

/** A temporary repository root with the given results files under reports/. */
function repoWith(files: { playwright?: string; vitest?: string; dotenv?: string } = {}): string {
  const root = makeEmptyDir('TEST_failures_');
  mkdirSync(join(root, 'reports'));
  if (files.playwright !== undefined) writeFileSync(join(root, 'reports', 'results.json'), files.playwright);
  if (files.vitest !== undefined) writeFileSync(join(root, 'reports', 'unit-results.json'), files.vitest.replaceAll('<ROOT>', root.replaceAll('\\', '/')));
  if (files.dotenv !== undefined) writeFileSync(join(root, '.env'), files.dotenv);
  return root;
}

const read = (path: string) => readFileSync(path, 'utf8');

/** A stub `gh`: answers the jobs JSON and the failed-step log, or fails with `error`. */
function stubGh(answers: { jobs?: object; log?: string; error?: string }): GhRunner & ReturnType<typeof vi.fn> {
  return vi.fn((args: string[]) => {
    if (answers.error !== undefined) return { status: 1, stdout: '', stderr: answers.error };
    return args.includes('--json') ? { status: 0, stdout: JSON.stringify(answers.jobs), stderr: '' } : { status: 0, stdout: answers.log ?? '', stderr: '' };
  });
}

const GITHUB_JOBS = {
  jobs: [
    { name: 'checks (lint)', conclusion: 'success', steps: [{ name: 'Run npm run lint', conclusion: 'success' }] },
    { name: 'main-ui-firefox', conclusion: 'failure', steps: [{ name: 'Run npm ci', conclusion: 'success' }, { name: 'Run npx playwright test --grep @smoke --project=firefox', conclusion: 'failure' }] },
    { name: 'promote', conclusion: 'skipped', steps: [] },
  ],
};
const githubLog = (extra = '') => Array.from({ length: GH_LOG_TOTAL_LINES }, (_, index) => `main-ui-firefox\tRun npx playwright test\tlog line ${String(index + 1)}${index === GH_LOG_TOTAL_LINES - 1 ? extra : ''}`).join('\n');

describe('Failure report — positive', () => {
  it('TC-000-152 failure report lists failed Playwright tests with error and evidence', () => {
    // Arrange: one passed and two failed tests, the first with a screenshot and a trace.
    const root = repoWith({ playwright: read(PLAYWRIGHT_FIXTURE) });

    // Act
    const { exitCode, output } = failureReport({ rootDir: root, processEnv: {} });

    // Assert: the results file with its date, then one entry per failure in report order, with
    // project, location, the first error line and the evidence paths; the passed test is absent.
    expect(exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(output).toMatch(/Playwright — reports\/results\.json \(written \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\)/);
    const first = output.indexOf('TC-900-31 shows the error message');
    const second = output.indexOf('TC-900-32 rejects an empty password');
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(first);
    expect(output).toContain('- **TC-900-31 shows the error message** — chromium — tests/ui/login-page.spec.ts:27');
    expect(output).toContain('  Error: expect(locator).toHaveText(expected) failed');
    expect(output).not.toContain('Received:');
    expect(output).toContain('  Trace: test-results/ui-login-page-TC-900-31-chromium-retry1/trace.zip');
    expect(output).toContain('  Screenshot: test-results/ui-login-page-TC-900-31-chromium/test-failed-1.png');
    expect(output).toContain('- **TC-900-32 rejects an empty password** — firefox — tests/ui/login-page.spec.ts:41');
    expect(output).toContain('  Test timeout of 30000ms exceeded.');
    expect(output).not.toContain('TC-900-30');
  });

  it('TC-000-153 failure report lists failed Vitest tests', () => {
    // Arrange
    const root = repoWith({ vitest: read(VITEST_FIXTURE) });

    // Act
    const { exitCode, output } = failureReport({ rootDir: root, processEnv: {} });

    // Assert: the failed test with its file (relative to the repository) and the first message line.
    expect(exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(output).toMatch(/Vitest — reports\/unit-results\.json \(written /);
    expect(output).toContain('- **TC-900-41 rejects a malformed URL** — tests/unit/config/env.test.ts');
    expect(output).toContain("  AssertionError: expected 'ok' to be 'Invalid BASE_URL'");
    expect(output).not.toContain('TC-900-40');
    expect(output).not.toContain('at tests/unit/config/env.test.ts:30:5');
  });

  it('TC-000-155 failure report of a GitHub run lists the failed jobs, steps and log lines', () => {
    // Arrange: a run with one failed job and a 60-line failed-step log.
    const gh = stubGh({ jobs: GITHUB_JOBS, log: githubLog(` ${ANSI_RED}FAIL${ANSI_RESET} ^[[41mTC-900-50^[[49m`) });

    // Act
    const { exitCode, output } = failureReport({ rootDir: repoWith(), processEnv: {}, run: '123', gh });

    // Assert: exactly the two gh calls; the failed job and step, and the last 40 log lines only.
    expect(exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(gh.mock.calls).toEqual([[['run', 'view', '123', '--json', 'jobs']], [['run', 'view', '123', '--log-failed']]]);
    expect(output).toContain('GitHub run 123');
    expect(output).toContain('- **main-ui-firefox** — failed step: Run npx playwright test --grep @smoke --project=firefox');
    expect(output).not.toContain('checks (lint)');
    expect(output).not.toContain('**promote**');
    expect(GITHUB_LOG_LINES).toBe(40);
    expect(output).toContain(`log line ${String(GH_LOG_TOTAL_LINES)}`);
    expect(output).toContain(`log line ${String(GH_LOG_TOTAL_LINES - GITHUB_LOG_LINES + 1)}`);
    expect(output).not.toContain(`log line ${String(GH_LOG_TOTAL_LINES - GITHUB_LOG_LINES)}\n`);
    // Terminal color codes, as ESC or as the caret text gh prints, are removed from the log.
    expect(output).toContain(`log line ${String(GH_LOG_TOTAL_LINES)} FAIL TC-900-50`);
    expect(output).not.toContain(ANSI_RED);
    expect(output).not.toContain('^[[');
  });

  it('TC-000-160 every local unit-test run writes the results the failure report reads', () => {
    // Arrange
    const manifest = JSON.parse(read(join(REPO_ROOT, 'package.json'))) as { scripts: Record<string, string> };
    const tasks = (JSON.parse(read(join(REPO_ROOT, '.vscode', 'tasks.json'))) as { tasks: { label: string; command: string }[] }).tasks;

    // Act
    const jsonResults = '--reporter=default --reporter=json --outputFile.json=reports/unit-results.json';

    // Assert: the report script, the CI script and the manual-run selector all write the Vitest JSON
    // results; the VS Code unit task uses the report script; the plain local command is unchanged.
    expect(manifest.scripts['test:unit:report']).toBe(`vitest run ${jsonResults}`);
    expect(manifest.scripts['test:unit:ci']).toContain(jsonResults);
    expect(UNIT_RUN_ARGS.join(' ')).toBe(`run ${jsonResults}`);
    expect(tasks.find((task) => task.label === 'Tests: unit tests')?.command).toBe('npm run test:unit:report');
    expect(manifest.scripts['test:unit']).toBe('vitest run');
  });
});

describe('Failure report — branches', () => {
  it("TC-000-170 report:failures --branch reads the results of that branch's worktree", () => {
    // Arrange: a worktrees folder holding release results with one failure, and no main worktree.
    const worktrees = makeEmptyDir('TEST_worktrees_');
    mkdirSync(join(worktrees, 'release', 'reports'), { recursive: true });
    writeFileSync(join(worktrees, 'release', 'reports', 'results.json'), read(PLAYWRIGHT_FIXTURE));
    const processEnv = { TEST_BRANCH_WORKTREES: worktrees };

    // Act
    const release = failureReport({ rootDir: repoWith(), processEnv, branch: 'release' });
    const main = failureReport({ rootDir: repoWith(), processEnv, branch: 'main' });

    // Assert: each branch reads its own worktree; a branch never tested locally has no results.
    expect(release.output).toContain(`Worktree of release: ${join(worktrees, 'release')}`);
    expect(release.output).toContain('TC-900-31 shows the error message');
    expect(main.output).toContain(NO_FAILURES);
    expect(main.output).toContain('Missing: reports/results.json, reports/unit-results.json');
    expect([release.exitCode, main.exitCode]).toEqual([SUCCESS_EXIT_CODE, SUCCESS_EXIT_CODE]);
  });
});

describe('Failure report — boundary', () => {
  it('TC-000-154 failure report without failures or without results says so', () => {
    // Arrange: only passed tests; then no results at all.
    const passing = repoWith({ playwright: read(PASSING_PLAYWRIGHT) });
    const empty = repoWith();

    // Act
    const withPasses = failureReport({ rootDir: passing, processEnv: {} });
    const withNothing = failureReport({ rootDir: empty, processEnv: {} });

    // Assert: both say nothing failed; the second names the missing files; neither fails.
    expect(withPasses.output).toContain(NO_FAILURES);
    expect(withNothing.output).toContain(NO_FAILURES);
    expect(withNothing.output).toContain('Missing: reports/results.json, reports/unit-results.json');
    expect([withPasses.exitCode, withNothing.exitCode]).toEqual([SUCCESS_EXIT_CODE, SUCCESS_EXIT_CODE]);
  });
});

describe('Failure report — negative', () => {
  it('TC-000-157 failure report of a GitHub run that cannot be read explains why', () => {
    // Arrange
    const gh = stubGh({ error: 'run 999 not found\n' });

    // Act
    const { exitCode, output } = failureReport({ rootDir: repoWith(), processEnv: {}, run: '999', gh });

    // Assert
    expect(exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(output).toContain('Cannot read GitHub run 999: run 999 not found');
  });
});

describe('Failure report — security', () => {
  it('TC-000-156 failure report redacts secrets', () => {
    // Arrange: a local failure and a GitHub log that both contain a password and a JWT-shaped token.
    const playwright = read(PLAYWRIGHT_FIXTURE).replace('Test timeout of 30000ms exceeded.', `Login failed for ${FAKE_PASSWORD} with ${FAKE_JWT}`);
    const processEnv = { TEST_USER_PASSWORD: FAKE_PASSWORD };
    const gh = stubGh({ jobs: GITHUB_JOBS, log: githubLog(` token=${FAKE_JWT} pass=${FAKE_PASSWORD}`) });

    // Act
    const local = failureReport({ rootDir: repoWith({ playwright }), processEnv }).output;
    const github = failureReport({ rootDir: repoWith(), processEnv, run: '123', gh }).output;

    // Assert
    for (const output of [local, github]) {
      expect(output).toContain('[REDACTED]');
      expect(output).not.toContain(FAKE_PASSWORD);
      expect(output).not.toContain(FAKE_JWT);
    }
  });

  it('TC-000-161 failure report redacts a password that is only in .env', () => {
    // Arrange: the password is known only from the repository's .env file.
    const playwright = read(PLAYWRIGHT_FIXTURE).replace('Test timeout of 30000ms exceeded.', `Login failed for ${FAKE_PASSWORD}`);
    const root = repoWith({ playwright, dotenv: `TEST_USER_PASSWORD=${FAKE_PASSWORD}\n` });

    // Act
    const { output } = failureReport({ rootDir: root, processEnv: {} });

    // Assert
    expect(output).toContain('Login failed for [REDACTED]');
    expect(output).not.toContain(FAKE_PASSWORD);
  });
});
