import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EnvValues } from '../src/config/env';
import { selectRun } from './ci-run-suite';
import { failureReport } from './failure-report';
import { worktreesDir } from './lib/worktrees';

export { worktreesDir };

// Local branch run (Spec 000, RF-98): `npm run test:branch` runs a manual test selection (SUITE,
// BROWSER, LAYER) on one of the promotion branches without any pipeline. The checked-out branch is
// tested in place; another branch is tested in a detached git worktree kept outside the repository
// (and outside OneDrive), so lint, typecheck and cloud sync never see it. Results go to the console.
// Branches are only fetched and checked out detached: nothing is created, deleted, merged or pushed.

export const BRANCHES = ['eyter_dev', 'release', 'main', 'production'] as const;
/** Lock file recorded at the last `npm ci` of a worktree. */
export const INSTALL_RECORD = '.test-branch-lock.json';
const DOTENV = '.env';
const LOCK_FILE = 'package-lock.json';
const SUCCESS = 0;
const FAILURE = 1;

export interface CommandResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Everything that touches git, npm, the tests or the disk; stubbed in unit tests. */
export interface BranchDeps {
  repoRoot: string;
  git(args: string[], cwd: string): CommandResult;
  npm(args: string[], cwd: string): CommandResult;
  /** Runs the selection (SUITE, BROWSER, LAYER in `env`) with `cwd` as working directory; returns its exit code. */
  runSelection(cwd: string, env: EnvValues): number;
  /** The failure report (RF-96) of the results under `rootDir`. */
  failureReport(rootDir: string): string;
  files: {
    exists(path: string): boolean;
    read(path: string): string;
    copy(from: string, to: string): void;
    write(path: string, text: string): void;
  };
}

const firstLine = (text: string): string => text.split(/\r?\n/).map((line) => line.trim()).find((line) => line !== '') ?? 'no details';
const selectionText = (env: EnvValues) => `SUITE=${env.SUITE ?? ''} BROWSER=${env.BROWSER ?? ''} LAYER=${env.LAYER ?? 'all'}`;

/** RF-98: runs the selection on BRANCH, in place or in its worktree. */
export function runBranch(env: EnvValues, deps: BranchDeps): { exitCode: number; output: string[] } {
  const branch = env.BRANCH ?? '';
  if (!(BRANCHES as readonly string[]).includes(branch)) {
    return { exitCode: FAILURE, output: [`Unsupported BRANCH="${branch}": allowed values are ${BRANCHES.join(', ')}`] };
  }
  const selection = selectRun(env);
  if (!selection.ok) return { exitCode: FAILURE, output: [selection.error] };
  const fail = (output: string[], message: string) => ({ exitCode: FAILURE, output: [...output, message] });

  const current = deps.git(['branch', '--show-current'], deps.repoRoot).stdout.trim();
  if (current === branch) {
    const output = [`Testing ${branch} in place (the working copy, uncommitted changes included): ${selectionText(env)}`];
    return { exitCode: deps.runSelection(deps.repoRoot, env), output };
  }

  const dir = join(worktreesDir(env), branch);
  const output = [`Testing ${branch} (origin/${branch}) in the local worktree ${dir}: ${selectionText(env)}`];
  const fetch = deps.git(['fetch', 'origin', branch], deps.repoRoot);
  if (fetch.status !== SUCCESS) return fail(output, `Cannot fetch ${branch} from origin: ${firstLine(fetch.stderr)}`);

  const checkout = deps.files.exists(dir)
    ? deps.git(['-C', dir, 'checkout', '--detach', `origin/${branch}`], deps.repoRoot)
    : deps.git(['worktree', 'add', '--detach', dir, `origin/${branch}`], deps.repoRoot);
  if (checkout.status !== SUCCESS) return fail(output, `Cannot prepare the worktree of ${branch}: ${firstLine(checkout.stderr)}`);

  // The local .env holds the test credentials: copy it only where git ignores it.
  const localDotenv = join(deps.repoRoot, DOTENV);
  if (deps.files.exists(localDotenv)) {
    if (deps.git(['-C', dir, 'check-ignore', '-q', DOTENV], deps.repoRoot).status !== SUCCESS) {
      return fail(output, `${DOTENV} is not ignored on ${branch}: not copied, nothing run`);
    }
    deps.files.copy(localDotenv, join(dir, DOTENV));
  }

  // Install only when the branch's lock file differs from the one installed last time.
  const lock = deps.files.read(join(dir, LOCK_FILE));
  const record = join(dir, INSTALL_RECORD);
  if (!deps.files.exists(record) || deps.files.read(record) !== lock) {
    const install = deps.npm(['ci'], dir);
    if (install.status !== SUCCESS) return fail(output, `npm ci failed in the worktree of ${branch}: ${firstLine(install.stderr)}`);
    deps.files.write(record, lock);
  }

  const exitCode = deps.runSelection(dir, env);
  return exitCode === SUCCESS ? { exitCode, output } : { exitCode, output: [...output, deps.failureReport(dir)] };
}

function main(): void {
  const repoRoot = process.cwd();
  const run = (command: string, args: string[], cwd: string): CommandResult => {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr || (result.error?.message ?? '') };
  };
  // `npm run` sets npm_execpath (npm's own CLI script), so npm runs through Node without a shell.
  const npmCli = process.env.npm_execpath;
  const deps: BranchDeps = {
    repoRoot,
    git: (args, cwd) => run('git', args, cwd),
    npm: (args, cwd) => {
      console.log(`npm ${args.join(' ')} in ${cwd} …`);
      return npmCli === undefined ? run('npm', args, cwd) : run(process.execPath, [npmCli, ...args], cwd);
    },
    runSelection: (cwd, env) =>
      // The checked-out branch's selector, run with the branch's own tests, config and node_modules.
      spawnSync(process.execPath, [join(repoRoot, 'dist', 'scripts', 'ci-run-suite.js')], { cwd, env: { ...process.env, ...env }, stdio: 'inherit' }).status ?? FAILURE,
    failureReport: (rootDir) => failureReport({ rootDir, processEnv: process.env }).output,
    files: { exists: existsSync, read: (path) => (existsSync(path) ? readFileSync(path, 'utf8') : ''), copy: copyFileSync, write: (path, text) => writeFileSync(path, text) },
  };
  // The tests stream their own output; this header comes first, the summary lines after it.
  console.log(`test:branch BRANCH=${process.env.BRANCH ?? ''} ${selectionText(process.env)} (local run, no pipeline)`);
  const result = runBranch(process.env, deps);
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) main();
