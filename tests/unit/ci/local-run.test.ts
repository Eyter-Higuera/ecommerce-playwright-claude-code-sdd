import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLAUDE_MISSING_MESSAGE, localRun, NO_REPORT_MESSAGE, type LocalRunDeps } from '../../../scripts/local-run';
import { fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-100: after a test run started from the VS Code test tasks
// (`npm run test:local -- <ci:run-suite | test:branch>`), the HTML Playwright report of that run
// opens in the browser whether it passed or failed, a unit-only run prints its summary instead, and
// a failed run then starts Claude Code with /fix-failure. CI runs and runs inside Claude Code do
// neither. The run, the browser, Claude Code and the disk are stubs that record each call: nothing
// is run, opened or started for real.
const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;
const ROOT = join(tmpdir(), 'TEST_repo');
const WORKTREES = join(tmpdir(), 'TEST_worktrees');
const RUN_START = 1_791_540_000_000;
const ONE_MINUTE_MS = 60_000;
const AFTER_START = RUN_START + ONE_MINUTE_MS;
const BEFORE_START = RUN_START - ONE_MINUTE_MS;
const REPORT = join(ROOT, 'playwright-report', 'index.html');
const RELEASE_REPORT = join(WORKTREES, 'release', 'playwright-report', 'index.html');
const UNIT_RESULTS = join(ROOT, 'reports', 'unit-results.json');
const FAILING_UNIT_RESULTS = readFileSync(fixturePath('reports', 'failures', 'unit-results.json'), 'utf8');
const PASSING_UNIT_RESULTS = JSON.stringify({ numTotalTests: 2, numPassedTests: 2, numFailedTests: 0, startTime: RUN_START, testResults: [] });
const SELECTION = { SUITE: 'smoke', BROWSER: 'chromium', TEST_BRANCH_WORKTREES: WORKTREES };

interface StubOptions {
  runExit?: number;
  /** Files on the stub disk with their modified time and content. */
  files?: Record<string, { modifiedAt: number; text?: string }>;
  claudeAvailable?: boolean;
}

/** Stub dependencies; `calls` records every run, browser and Claude Code call in order. */
function stubDeps(options: StubOptions = {}) {
  const calls: string[] = [];
  const files = options.files ?? {};
  const deps: LocalRunDeps = {
    repoRoot: ROOT,
    run: (script, env) => {
      calls.push(`run ${script} LAYER=${env.LAYER ?? ''}`);
      return options.runExit ?? SUCCESS_EXIT_CODE;
    },
    currentBranch: () => 'eyter_dev',
    now: () => RUN_START,
    files: {
      exists: (path) => path in files,
      modifiedAt: (path) => files[path]?.modifiedAt ?? 0,
      read: (path) => files[path]?.text ?? '',
    },
    openInBrowser: (file) => calls.push(`open ${file}`),
    startClaude: (prompt) => {
      calls.push(`claude ${prompt}`);
      return options.claudeAvailable ?? true;
    },
  };
  return { deps, calls };
}

const freshReport = { [REPORT]: { modifiedAt: AFTER_START } };

describe('test:local — positive', () => {
  it('TC-000-177 a passing VS Code run opens its report and starts no Claude Code', () => {
    // Arrange: a passing run that wrote a new report.
    const stub = stubDeps({ files: freshReport });

    // Act
    const result = localRun('ci:run-suite', { ...SELECTION, LAYER: 'all' }, stub.deps);

    // Assert: the report opens even though nothing failed; no fix is needed.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(stub.calls).toEqual(['run ci:run-suite LAYER=all', `open ${REPORT}`]);
  });

  it('TC-000-178 a failing VS Code run opens its report first, then starts /fix-failure', () => {
    // Arrange: a failing UI run that wrote a new report.
    const stub = stubDeps({ runExit: FAILURE_EXIT_CODE, files: freshReport });

    // Act
    const result = localRun('ci:run-suite', { ...SELECTION, LAYER: 'ui' }, stub.deps);

    // Assert: the full report is shown before /fix-failure re-runs tests and overwrites it, and the
    // task keeps the run's exit code.
    expect(stub.calls).toEqual(['run ci:run-suite LAYER=ui', `open ${REPORT}`, 'claude /fix-failure']);
    expect(result.exitCode).toBe(FAILURE_EXIT_CODE);
  });

  it('TC-000-179 a failing run on another branch opens the worktree report and starts /fix-failure <branch>', () => {
    // Arrange: eyter_dev is checked out; release ran in its worktree and wrote a new report there.
    const stub = stubDeps({ runExit: FAILURE_EXIT_CODE, files: { [RELEASE_REPORT]: { modifiedAt: AFTER_START } } });

    // Act
    const result = localRun('test:branch', { ...SELECTION, LAYER: 'api', BRANCH: 'release' }, stub.deps);

    // Assert: the release results are shown and fixed, never the repository's own report.
    expect(stub.calls).toEqual(['run test:branch LAYER=api', `open ${RELEASE_REPORT}`, 'claude /fix-failure release']);
    expect(result.exitCode).toBe(FAILURE_EXIT_CODE);
  });
});

describe('test:local — boundary', () => {
  it('TC-000-180 a unit-only run prints the unit summary and opens no browser', () => {
    // Arrange: a passing and a failing unit-only run, each with its results file.
    const passing = stubDeps({ files: { [UNIT_RESULTS]: { modifiedAt: AFTER_START, text: PASSING_UNIT_RESULTS } } });
    const failing = stubDeps({ runExit: FAILURE_EXIT_CODE, files: { [UNIT_RESULTS]: { modifiedAt: AFTER_START, text: FAILING_UNIT_RESULTS } } });

    // Act
    const passed = localRun('ci:run-suite', { ...SELECTION, LAYER: 'unit' }, passing.deps);
    const failed = localRun('ci:run-suite', { ...SELECTION, LAYER: 'unit' }, failing.deps);

    // Assert: the summary table is in the terminal (Playwright writes no report for unit tests) ...
    expect(passed.output.join('\n')).toMatch(/\| Unit tests \| 2 \| 0 \| 0 \| 0 \| 2 \|/);
    expect(failed.output.join('\n')).toMatch(/\| Unit tests \| 2 \| 1 \| 0 \| 0 \| 3 \|/);
    // ... no browser opens, and only the failing run starts the fix.
    expect(passing.calls).toEqual(['run ci:run-suite LAYER=unit']);
    expect(failing.calls).toEqual(['run ci:run-suite LAYER=unit', 'claude /fix-failure']);
  });
});

describe('test:local — negative', () => {
  it('TC-000-181 a missing or stale report is not opened', () => {
    // Arrange: no report at all; then a report left by an earlier run.
    const missing = stubDeps();
    const stale = stubDeps({ files: { [REPORT]: { modifiedAt: BEFORE_START } } });

    // Act
    const results = [missing, stale].map((stub) => localRun('ci:run-suite', { ...SELECTION, LAYER: 'api' }, stub.deps));

    // Assert: an old report is never shown as the result of this run.
    for (const result of results) expect(result.output).toContain(NO_REPORT_MESSAGE);
    expect([...missing.calls, ...stale.calls].filter((call) => call.startsWith('open'))).toEqual([]);
  });

  it('TC-000-182 Claude Code missing prints how to start /fix-failure', () => {
    // Arrange: a failing run on a PC where the claude command cannot start.
    const stub = stubDeps({ runExit: FAILURE_EXIT_CODE, files: freshReport, claudeAvailable: false });

    // Act
    const result = localRun('ci:run-suite', { ...SELECTION, LAYER: 'ui' }, stub.deps);

    // Assert: the user is told what to do, the report was still opened, the run's code is kept.
    expect(result.output).toContain(CLAUDE_MISSING_MESSAGE);
    expect(stub.calls).toContain(`open ${REPORT}`);
    expect(result.exitCode).toBe(FAILURE_EXIT_CODE);
  });
});

describe('test:local — security', () => {
  it('TC-000-183 CI and Claude Code sessions open no browser and start no Claude Code', () => {
    // Arrange: a failing run in CI and a failing run started by Claude Code itself.
    const environments = [{ CI: 'true' }, { CLAUDECODE: '1' }];
    const stubs = environments.map(() => stubDeps({ runExit: FAILURE_EXIT_CODE, files: freshReport }));

    // Act
    const results = environments.map((extra, index) => localRun('ci:run-suite', { ...SELECTION, LAYER: 'ui', ...extra }, stubs[index]!.deps));

    // Assert: only the run happens: no browser in CI, and Claude Code never starts itself.
    for (const stub of stubs) expect(stub.calls).toEqual(['run ci:run-suite LAYER=ui']);
    for (const result of results) expect(result.exitCode).toBe(FAILURE_EXIT_CODE);
  });
});
