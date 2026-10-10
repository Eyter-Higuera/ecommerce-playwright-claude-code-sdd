import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBranch, worktreesDir, type BranchDeps, type CommandResult } from '../../../scripts/run-branch';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-98: `npm run test:branch` runs a manual test selection on the
// checked-out branch in place, or on another promotion branch in a detached git worktree kept
// outside the repository, and never starts a pipeline or changes a branch. Every git, npm, test and
// file operation goes through stubs that record it: nothing is fetched, installed or run for real.
const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;
const ROOT = join(tmpdir(), 'TEST_repo');
const WORKTREES = join(tmpdir(), 'TEST_worktrees');
const SELECTION = { SUITE: 'smoke', BROWSER: 'chromium', LAYER: 'api', TEST_BRANCH_WORKTREES: WORKTREES };
const LOCK = '{"lockfileVersion":3,"name":"TEST_lock"}';
const FORBIDDEN_GIT = [/^push\b/, /\bbranch -[dD]\b/, /\bcheckout -b\b/, /\bswitch -c\b/, /\bworktree remove\b/, /\breset --hard\b/, /\bmerge\b/];

const ok = (stdout = ''): CommandResult => ({ status: 0, stdout, stderr: '' });

interface StubOptions {
  current?: string;
  fetchError?: string;
  envIgnored?: boolean;
  selectionExit?: number;
  files?: Record<string, string>;
}

/** Stub dependencies: an in-memory file system and recorders for every command. */
function stubDeps(options: StubOptions = {}) {
  const files = new Map(Object.entries({ [join(ROOT, '.env')]: 'TEST_USER_EMAIL=TEST_a@example.test\n', ...options.files }));
  const git: string[] = [];
  const npm: string[] = [];
  const selections: { cwd: string; env: Record<string, string | undefined> }[] = [];
  const reports: string[] = [];
  const deps: BranchDeps = {
    repoRoot: ROOT,
    git: (args, cwd) => {
      git.push(`${args.join(' ')} @ ${cwd}`);
      if (args[0] === 'branch') return ok(`${options.current ?? 'eyter_dev'}\n`);
      if (args[0] === 'fetch' && options.fetchError !== undefined) return { status: 128, stdout: '', stderr: `fatal: ${options.fetchError}\n` };
      if (args[0] === 'worktree') files.set(join(args[3] ?? '', 'package-lock.json'), LOCK);
      if (args.includes('check-ignore')) return options.envIgnored === false ? { status: 1, stdout: '', stderr: '' } : ok();
      return ok();
    },
    npm: (args, cwd) => {
      npm.push(`${args.join(' ')} @ ${cwd}`);
      return ok();
    },
    runSelection: (cwd, env) => {
      selections.push({ cwd, env: { SUITE: env.SUITE, BROWSER: env.BROWSER, LAYER: env.LAYER } });
      return options.selectionExit ?? SUCCESS_EXIT_CODE;
    },
    failureReport: (rootDir) => {
      reports.push(rootDir);
      return `## Playwright — reports/results.json\n- **TC-900-60 fails** — chromium — tests/ui/x.spec.ts:3`;
    },
    files: {
      exists: (path) => [...files.keys()].some((key) => key === path || key.startsWith(`${path}\\`) || key.startsWith(`${path}/`)),
      read: (path) => files.get(path) ?? '',
      copy: (from, to) => files.set(to, files.get(from) ?? ''),
      write: (path, text) => files.set(path, text),
    },
  };
  return { deps, git, npm, selections, reports, files };
}

const releaseDir = join(WORKTREES, 'release');

describe('test:branch — positive', () => {
  it('TC-000-163 test:branch on the checked-out branch runs in place', () => {
    // Arrange: eyter_dev is checked out (its working copy may hold uncommitted changes).
    const stub = stubDeps({ current: 'eyter_dev' });

    // Act
    const result = runBranch({ ...SELECTION, BRANCH: 'eyter_dev' }, stub.deps);

    // Assert: no fetch, no worktree: the working copy itself is tested.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(stub.git.filter((command) => /^(fetch|worktree)|-C /.test(command))).toEqual([]);
    expect(stub.selections).toEqual([{ cwd: ROOT, env: { SUITE: 'smoke', BROWSER: 'chromium', LAYER: 'api' } }]);
    expect(result.output.join('\n')).toContain('Testing eyter_dev in place (the working copy, uncommitted changes included): SUITE=smoke BROWSER=chromium LAYER=api');
  });

  it('TC-000-164 test:branch on another branch creates its worktree once and moves it later', () => {
    // Arrange: no worktree yet.
    const stub = stubDeps();
    const env = { ...SELECTION, BRANCH: 'release' };

    // Act
    const first = runBranch(env, stub.deps);
    const gitAfterFirst = [...stub.git];
    const second = runBranch(env, stub.deps);

    // Assert: first run creates the detached worktree, checks .env is ignored, copies it, installs
    // and runs there; the second run moves the worktree and skips the unchanged install.
    expect([first.exitCode, second.exitCode]).toEqual([SUCCESS_EXIT_CODE, SUCCESS_EXIT_CODE]);
    expect(gitAfterFirst).toEqual([
      `branch --show-current @ ${ROOT}`,
      `fetch origin release @ ${ROOT}`,
      `worktree add --detach ${releaseDir} origin/release @ ${ROOT}`,
      `-C ${releaseDir} check-ignore -q .env @ ${ROOT}`,
    ]);
    expect(stub.git.slice(gitAfterFirst.length)).toEqual([
      `branch --show-current @ ${ROOT}`,
      `fetch origin release @ ${ROOT}`,
      `-C ${releaseDir} checkout --detach origin/release @ ${ROOT}`,
      `-C ${releaseDir} check-ignore -q .env @ ${ROOT}`,
    ]);
    expect(stub.files.get(join(releaseDir, '.env'))).toBe(stub.files.get(join(ROOT, '.env')));
    expect(stub.npm).toEqual([`ci @ ${releaseDir}`]);
    expect(stub.selections.map((selection) => selection.cwd)).toEqual([releaseDir, releaseDir]);
  });

  it('TC-000-169 test:branch shows the failure report when the branch run is red', () => {
    // Arrange: a red selection, then a green one.
    const red = stubDeps({ selectionExit: FAILURE_EXIT_CODE });
    const green = stubDeps();

    // Act
    const redResult = runBranch({ ...SELECTION, BRANCH: 'release' }, red.deps);
    const greenResult = runBranch({ ...SELECTION, BRANCH: 'release' }, green.deps);

    // Assert: the red run ends with that worktree's failure report; the green run has none.
    expect(redResult.exitCode).toBe(FAILURE_EXIT_CODE);
    expect(red.reports).toEqual([releaseDir]);
    expect(redResult.output.at(-1)).toContain('TC-900-60 fails');
    expect(greenResult.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(green.reports).toEqual([]);
  });
});

describe('test:branch — boundary', () => {
  it('TC-000-165 test:branch reinstalls only when the branch\'s lock file changed', () => {
    // Arrange: an existing worktree installed with LOCK, whose lock file then changes.
    const stub = stubDeps({ files: { [join(releaseDir, 'package-lock.json')]: LOCK } });
    const env = { ...SELECTION, BRANCH: 'release' };
    runBranch(env, stub.deps);

    // Act
    runBranch(env, stub.deps);
    stub.files.set(join(releaseDir, 'package-lock.json'), '{"lockfileVersion":3,"name":"TEST_lock_changed"}');
    runBranch(env, stub.deps);

    // Assert: installed on the first run (no record yet) and after the change, not in between.
    expect(stub.npm).toEqual([`ci @ ${releaseDir}`, `ci @ ${releaseDir}`]);
  });

  it('TC-000-172 test:branch worktrees live outside the repository and synced folders', () => {
    // Arrange
    const localAppData = join(tmpdir(), 'TEST_localappdata');
    const home = join(tmpdir(), 'TEST_home');

    // Act
    const windows = worktreesDir({ LOCALAPPDATA: localAppData, HOME: home });
    const linux = worktreesDir({ HOME: home });
    const override = worktreesDir({ LOCALAPPDATA: localAppData, TEST_BRANCH_WORKTREES: WORKTREES });
    const real = worktreesDir(process.env);

    // Assert: the per-user cache folder, or the override; the real default is outside the repository.
    expect(windows).toBe(join(localAppData, 'ecommerce-playwright-sdd', 'worktrees'));
    expect(linux).toBe(join(home, '.cache', 'ecommerce-playwright-sdd', 'worktrees'));
    expect(override).toBe(WORKTREES);
    expect(relative(REPO_ROOT, real).startsWith('..')).toBe(true);
  });
});

describe('test:branch — negative', () => {
  it('TC-000-166 test:branch refuses a branch that is not a promotion branch', () => {
    // Arrange
    const invalid = ['feature/x', 'Release', ''];

    // Act
    const runs = invalid.map((branch) => ({ branch, stub: stubDeps() })).map(({ branch, stub }) => ({ branch, stub, result: runBranch({ ...SELECTION, BRANCH: branch }, stub.deps) }));

    // Assert: refused naming the allowed values; nothing is run.
    for (const { branch, stub, result } of runs) {
      expect(result.exitCode, branch).not.toBe(SUCCESS_EXIT_CODE);
      expect(result.output, branch).toEqual([`Unsupported BRANCH="${branch}": allowed values are eyter_dev, release, main, production`]);
      expect([stub.git, stub.npm, stub.selections], branch).toEqual([[], [], []]);
    }
  });

  it('TC-000-167 test:branch stops when the branch cannot be fetched', () => {
    // Arrange: origin is unreachable.
    const stub = stubDeps({ fetchError: 'Could not resolve host: github.com' });

    // Act
    const result = runBranch({ ...SELECTION, BRANCH: 'main' }, stub.deps);

    // Assert: stopped before the worktree, the install and the tests.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output.at(-1)).toBe('Cannot fetch main from origin: fatal: Could not resolve host: github.com');
    expect(stub.git.at(-1)).toBe(`fetch origin main @ ${ROOT}`);
    expect([stub.npm, stub.selections]).toEqual([[], []]);
  });
});

describe('test:branch — security', () => {
  it('TC-000-168 test:branch never creates, deletes or pushes a branch', () => {
    // Arrange: every scenario above.
    const scenarios = [
      { options: { current: 'eyter_dev' }, branch: 'eyter_dev' },
      { options: {}, branch: 'release' },
      { options: { files: { [join(WORKTREES, 'main', 'package-lock.json')]: LOCK } }, branch: 'main' },
      { options: { selectionExit: FAILURE_EXIT_CODE }, branch: 'production' },
      { options: { fetchError: 'TEST_unreachable' }, branch: 'release' },
    ];

    // Act
    const commands = scenarios.flatMap(({ options, branch }) => {
      const stub = stubDeps(options);
      runBranch({ ...SELECTION, BRANCH: branch }, stub.deps);
      return stub.git;
    });

    // Assert: only reads, fetches and detached worktrees.
    for (const command of commands) for (const forbidden of FORBIDDEN_GIT) expect(command, command).not.toMatch(forbidden);
    for (const command of commands.filter((entry) => entry.startsWith('worktree add') || entry.includes(' checkout '))) expect(command).toContain('--detach');
    expect(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).toContain('"test:branch": "npm run build:scripts --silent && node dist/scripts/run-branch.js"');
  });

  it('TC-000-174 test:branch stops instead of copying .env into a branch that does not ignore it', () => {
    // Arrange: the branch's .gitignore does not ignore .env.
    const stub = stubDeps({ envIgnored: false });

    // Act
    const result = runBranch({ ...SELECTION, BRANCH: 'release' }, stub.deps);

    // Assert: the secret file is never written into the worktree; nothing is installed or run.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output.at(-1)).toBe('.env is not ignored on release: not copied, nothing run');
    expect(stub.files.has(join(releaseDir, '.env'))).toBe(false);
    expect([stub.npm, stub.selections]).toEqual([[], []]);
  });
});
