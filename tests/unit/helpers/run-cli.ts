import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Helper for unit tests that must prove behavior of a real CLI (Vitest, tsc, Playwright --list).
// Child processes get a minimal environment so no developer variable or `.env` value leaks in,
// and they never reach the network: every fixture they run is local.

export const REPO_ROOT = resolve(__dirname, '../../..');
export const FIXTURES_ROOT = join(REPO_ROOT, 'tests', 'fixtures');

/** Budget for tests that spawn a CLI; process start-up dominates, so it is far above unit speed. */
export const CLI_TEST_TIMEOUT_MS = 60_000;

const VITEST_CLI = join(REPO_ROOT, 'node_modules', 'vitest', 'vitest.mjs');

// Variables the OS needs to start Node and resolve temp folders, plus where browsers are installed
// (the CI Playwright image sets PLAYWRIGHT_BROWSERS_PATH=/ms-playwright); nothing project-specific.
const SYSTEM_ENV_ALLOWLIST = [
  'PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA',
  'PLAYWRIGHT_BROWSERS_PATH',
];

export interface CliResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  /** stdout and stderr together, for assertions that do not care about the stream. */
  output: string;
}

export interface RunOptions {
  cwd?: string;
  /** Extra variables for the child; an `undefined` value removes the variable. */
  env?: Record<string, string | undefined>;
}

export function fixturePath(...segments: string[]): string {
  return join(FIXTURES_ROOT, ...segments);
}

/** Creates an empty temporary directory, used as cwd so the repository `.env` is not loaded. */
export function makeEmptyDir(prefix = 'TEST_cli_'): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function buildChildEnv(extra: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const name of SYSTEM_ENV_ALLOWLIST) {
    const value = process.env[name];
    if (value !== undefined) env[name] = value;
  }
  // Colors would make output assertions brittle.
  env.NO_COLOR = '1';
  env.FORCE_COLOR = '0';
  for (const [name, value] of Object.entries(extra)) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }
  return env;
}

/** Runs a Node.js script (CLI entry point) in a child process and captures its output. */
export function runNodeScript(scriptPath: string, args: string[], options: RunOptions = {}): CliResult {
  return runCommand(process.execPath, [scriptPath, ...args], options);
}

/** Runs any executable on PATH (e.g. `git`) in a child process and captures its output. */
export function runCommand(command: string, args: string[], options: RunOptions = {}): CliResult {
  const child = spawnSync(command, args, {
    cwd: options.cwd ?? makeEmptyDir(),
    env: buildChildEnv(options.env),
    encoding: 'utf8',
    timeout: CLI_TEST_TIMEOUT_MS,
  });
  const stdout = child.stdout ?? '';
  const stderr = child.stderr ?? '';
  return { exitCode: child.status, stdout, stderr, output: `${stdout}\n${stderr}` };
}

const PLAYWRIGHT_CLI = join(REPO_ROOT, 'node_modules', '@playwright', 'test', 'cli.js');
export const REPO_PLAYWRIGHT_CONFIG = join(REPO_ROOT, 'playwright.config.ts');

/**
 * Runs the Playwright CLI. By default it uses the repository config and an empty temporary cwd,
 * so the repository `.env` is not loaded and only `options.env` provides configuration.
 */
export function runPlaywright(args: string[], options: RunOptions & { config?: string } = {}): CliResult {
  const { config = REPO_PLAYWRIGHT_CONFIG, ...runOptions } = options;
  return runNodeScript(PLAYWRIGHT_CLI, [...args, '--config', config], runOptions);
}

/** Runs `vitest run` on a self-contained fixture project. */
export function runVitest(projectDir: string, options: RunOptions = {}): CliResult {
  return runNodeScript(VITEST_CLI, ['run', '--root', projectDir], { cwd: projectDir, ...options });
}
