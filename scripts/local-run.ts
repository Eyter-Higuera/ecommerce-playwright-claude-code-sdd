import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { EnvValues } from '../src/config/env';
import { HTML_REPORT_DIR } from '../src/config/playwright-options';
import { UNIT_RESULTS_FILE } from './failure-report';
import { worktreesDir } from './lib/worktrees';
import { BRANCHES } from './run-branch';
import { renderSummary, summarizeResults, unknownResultsMessage } from './test-summary';

// Follow-up of the VS Code test tasks (Spec 000, RF-100): `npm run test:local -- <ci:run-suite |
// test:branch>` runs the selection, then shows its results whether it passed or failed: the HTML
// Playwright report opens in the default browser (a unit-only run prints its summary instead), and
// when the run failed, Claude Code starts with /fix-failure in the same terminal. The report opens
// first because /fix-failure re-runs the failed tests and overwrites it. CI runs and runs inside
// Claude Code only run the selection, so no browser opens in CI and Claude Code never starts itself.

export const LOCAL_SCRIPTS = ['ci:run-suite', 'test:branch'] as const;
export const NO_REPORT_MESSAGE = 'No Playwright report was written by this run';
export const CLAUDE_MISSING_MESSAGE = 'Claude Code is not available: open it and type /fix-failure';
const REPORT_PAGE = 'index.html';
const UNIT_STAGE = 'Unit tests';
const FIX_FAILURE = '/fix-failure';
const SUCCESS = 0;
const FAILURE = 1;
// Exit codes of a shell that cannot find a command: cmd.exe (Windows) and POSIX shells.
const COMMAND_NOT_FOUND = [9009, 127];

/** Everything that runs, opens, starts or reads; stubbed in unit tests. */
export interface LocalRunDeps {
  repoRoot: string;
  /** Runs the npm script with the selection in `env`, its output streamed; returns its exit code. */
  run(script: string, env: EnvValues): number;
  currentBranch(): string;
  now(): number;
  files: {
    exists(path: string): boolean;
    /** Last modification time in milliseconds since the epoch. */
    modifiedAt(path: string): number;
    read(path: string): string;
  };
  openInBrowser(file: string): void;
  /** Starts Claude Code with the prompt and waits for it; false when it cannot be started. */
  startClaude(prompt: string): boolean;
}

/** The promotion branch tested in a worktree (RF-98), or undefined when the run used the repository. */
function worktreeBranch(script: string, env: EnvValues, deps: LocalRunDeps): string | undefined {
  const branch = env.BRANCH ?? '';
  const isPromotionBranch = (BRANCHES as readonly string[]).includes(branch);
  return script === 'test:branch' && isPromotionBranch && branch !== deps.currentBranch() ? branch : undefined;
}

/** RF-100: the summary of a unit-only run, or the HTML report of a run with API or UI tests. */
function showResults(rootDir: string, env: EnvValues, startedAt: number, deps: LocalRunDeps): string[] {
  // A file older than the run belongs to an earlier run and is never shown as this run's result.
  const writtenByRun = (path: string) => deps.files.exists(path) && deps.files.modifiedAt(path) >= startedAt;
  if (env.LAYER === 'unit') {
    const results = join(rootDir, UNIT_RESULTS_FILE);
    return writtenByRun(results) ? [renderSummary(summarizeResults(UNIT_STAGE, deps.files.read(results)))] : [unknownResultsMessage(results)];
  }
  const report = join(rootDir, HTML_REPORT_DIR, REPORT_PAGE);
  if (!writtenByRun(report)) return [NO_REPORT_MESSAGE];
  deps.openInBrowser(report);
  return [`Opened the Playwright report in the browser: ${report}`];
}

/** RF-100: runs the selection, shows its results, and starts /fix-failure when it failed. */
export function localRun(script: string, env: EnvValues, deps: LocalRunDeps): { exitCode: number; output: string[] } {
  if (!(LOCAL_SCRIPTS as readonly string[]).includes(script)) {
    return { exitCode: FAILURE, output: [`Unsupported script "${script}": use ${LOCAL_SCRIPTS.join(' or ')}`] };
  }
  const startedAt = deps.now();
  const exitCode = deps.run(script, env);
  if (env.CI === 'true' || env.CLAUDECODE !== undefined) return { exitCode, output: [] };

  const branch = worktreeBranch(script, env, deps);
  const rootDir = branch === undefined ? deps.repoRoot : join(worktreesDir(env), branch);
  const output = showResults(rootDir, env, startedAt, deps);
  if (exitCode !== SUCCESS) {
    const prompt = branch === undefined ? FIX_FAILURE : `${FIX_FAILURE} ${branch}`;
    if (!deps.startClaude(prompt)) output.push(CLAUDE_MISSING_MESSAGE);
  }
  return { exitCode, output };
}

function main(): void {
  const isWindows = process.platform === 'win32';
  // `npm run` sets npm_execpath (npm's own CLI script), so npm runs through Node without a shell.
  const npmCli = process.env.npm_execpath;
  const deps: LocalRunDeps = {
    repoRoot: process.cwd(),
    run: (script, env) => {
      const [command, args] = npmCli === undefined ? ['npm', ['run', script]] as const : [process.execPath, [npmCli, 'run', script]] as const;
      return spawnSync(command, [...args], { env: { ...process.env, ...env }, stdio: 'inherit', shell: npmCli === undefined && isWindows }).status ?? FAILURE;
    },
    currentBranch: () => spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).stdout.trim(),
    now: () => Date.now(),
    files: { exists: existsSync, modifiedAt: (path) => statSync(path).mtimeMs, read: (path) => readFileSync(path, 'utf8') },
    openInBrowser: (file) => {
      // The default program for .html files; detached, so the terminal is free for Claude Code.
      const opener = isWindows ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      spawn(opener, [file], { detached: true, stdio: 'ignore' }).unref();
    },
    startClaude: (prompt) => {
      // On Windows `claude` is a .cmd shim that only a shell can start; the prompt is quoted because
      // the shell joins the arguments (it holds only "/fix-failure" and a promotion branch name).
      const result = isWindows ? spawnSync(`claude "${prompt}"`, { stdio: 'inherit', shell: true }) : spawnSync('claude', [prompt], { stdio: 'inherit' });
      return result.error === undefined && !COMMAND_NOT_FOUND.includes(result.status ?? SUCCESS);
    },
  };
  const result = localRun(process.argv[2] ?? '', process.env, deps);
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) main();
