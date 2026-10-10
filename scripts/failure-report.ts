import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { DEFAULT_DOTENV_FILE, loadEnv, type EnvValues } from '../src/config/env';
import { JSON_REPORT_FILE } from '../src/config/playwright-options';
import { REDACTED, getSensitiveValues, redact } from '../src/security/redact';
import { JWT_SHAPE } from './check-secrets';

// Failure report (Spec 000, RF-96): `npm run report:failures` lists why the last local run failed
// (Playwright reports/results.json and Vitest reports/unit-results.json), or, with `--run <id>`, which
// jobs and steps of a GitHub Actions run failed and the end of their log. The user and the
// `/fix-failure` skill (RF-97) start from it. Passwords (process environment and .env) and
// JWT-shaped tokens are redacted from everything printed, and the command always exits 0.

export const UNIT_RESULTS_FILE = 'reports/unit-results.json';
/** RF-96: lines of the failed-step log shown for a GitHub run. */
export const GITHUB_LOG_LINES = 40;
const PLAYWRIGHT_TESTS_DIR = 'tests';
/**
 * Terminal color codes in GitHub logs, as the ESC character or as the caret text `^[` that
 * `gh run view --log-failed` prints; removed so the log tail reads as plain text.
 */
const ANSI_COLOR = new RegExp(`(?:${String.fromCharCode(27)}|\\^\\[)\\[[0-9;]*m`, 'g');
const SUCCESS = 0;

/** Runs the GitHub CLI; injected so unit tests never call the real `gh`. */
export type GhRunner = (args: string[]) => { status: number | null; stdout: string; stderr: string };

export interface FailureReportOptions {
  rootDir: string;
  /** Merged over the repository's .env for redaction (defaults to process.env in main). */
  processEnv: EnvValues;
  /** A GitHub Actions run id: report that run instead of the local results. */
  run?: string;
  gh?: GhRunner;
}

interface Failure {
  title: string;
  where: string;
  message: string;
  evidence: string[];
}

const firstLine = (text: string | undefined): string => (text ?? '').split(/\r?\n/).map((line) => line.trim()).find((line) => line !== '') ?? '(no error message)';
const toPosix = (path: string) => path.replaceAll('\\', '/');

// --- Playwright --------------------------------------------------------------------------------

interface PlaywrightResult {
  errors?: { message?: string }[];
  error?: { message?: string };
  attachments?: { name: string; path?: string }[];
}
interface PlaywrightSuite {
  file?: string;
  specs?: { title: string; file?: string; line?: number; tests?: { projectName?: string; status?: string; results?: PlaywrightResult[] }[] }[];
  suites?: PlaywrightSuite[];
}

/** RF-96: failed Playwright tests (status `unexpected`) with the first error and the evidence paths. */
export function playwrightFailures(resultsText: string, rootDir: string): Failure[] {
  const report = JSON.parse(resultsText) as PlaywrightSuite & { config?: { rootDir?: string } };
  const testsDir = report.config?.rootDir ?? join(rootDir, PLAYWRIGHT_TESTS_DIR);
  const fromRoot = (path: string) => toPosix(relative(rootDir, isAbsolute(path) ? path : resolve(rootDir, path)));
  const walk = (suite: PlaywrightSuite): Failure[] => [
    ...(suite.specs ?? []).flatMap((spec) =>
      (spec.tests ?? [])
        .filter((test) => test.status === 'unexpected')
        .map((test): Failure => {
          const results = test.results ?? [];
          const failed = results.find((result) => (result.errors?.length ?? 0) > 0 || result.error !== undefined) ?? results[0];
          const attachments = results.flatMap((result) => result.attachments ?? []);
          const pathOf = (name: string) => attachments.find((attachment) => attachment.name === name && attachment.path !== undefined)?.path;
          const trace = pathOf('trace');
          const screenshot = pathOf('screenshot');
          const file = spec.file ?? suite.file ?? '';
          return {
            title: spec.title,
            where: `${test.projectName ?? '?'} — ${fromRoot(join(testsDir, file))}${spec.line === undefined ? '' : `:${String(spec.line)}`}`,
            message: firstLine(failed?.errors?.[0]?.message ?? failed?.error?.message),
            evidence: [...(trace === undefined ? [] : [`Trace: ${fromRoot(trace)}`]), ...(screenshot === undefined ? [] : [`Screenshot: ${fromRoot(screenshot)}`])],
          };
        }),
    ),
    ...(suite.suites ?? []).flatMap(walk),
  ];
  return walk(report);
}

// --- Vitest ------------------------------------------------------------------------------------

interface VitestReport {
  testResults?: { name?: string; assertionResults?: { title: string; status?: string; failureMessages?: string[] }[] }[];
}

/** RF-96: failed Vitest tests with their file and the first failure-message line. */
export function vitestFailures(resultsText: string, rootDir: string): Failure[] {
  const report = JSON.parse(resultsText) as VitestReport;
  return (report.testResults ?? []).flatMap((file) =>
    (file.assertionResults ?? [])
      .filter((test) => test.status === 'failed')
      .map((test) => ({ title: test.title, where: toPosix(relative(rootDir, file.name ?? '')), message: firstLine(test.failureMessages?.[0]), evidence: [] })),
  );
}

// --- GitHub run --------------------------------------------------------------------------------

interface RunJobs {
  jobs?: { name: string; conclusion?: string; steps?: { name: string; conclusion?: string }[] }[];
}

function githubRunReport(run: string, gh: GhRunner): string {
  const jobsCall = gh(['run', 'view', run, '--json', 'jobs']);
  if (jobsCall.status !== SUCCESS) return `Cannot read GitHub run ${run}: ${firstLine(jobsCall.stderr)}`;
  const logCall = gh(['run', 'view', run, '--log-failed']);
  if (logCall.status !== SUCCESS) return `Cannot read GitHub run ${run}: ${firstLine(logCall.stderr)}`;
  const failedJobs = ((JSON.parse(jobsCall.stdout) as RunJobs).jobs ?? []).filter((job) => job.conclusion === 'failure');
  if (failedJobs.length === 0) return `GitHub run ${run}: no failed job`;
  const jobs = failedJobs.map((job) => {
    const step = (job.steps ?? []).find((candidate) => candidate.conclusion === 'failure');
    return `- **${job.name}** — failed step: ${step?.name ?? '(no step reported)'}`;
  });
  const logTail = logCall.stdout.replace(ANSI_COLOR, '').replace(/\s+$/, '').split(/\r?\n/).slice(-GITHUB_LOG_LINES);
  return [`## GitHub run ${run}`, '', ...jobs, '', `Last ${String(GITHUB_LOG_LINES)} lines of the failed steps' log:`, '', '```', ...logTail, '```'].join('\n');
}

// --- Report ------------------------------------------------------------------------------------

function renderSection(label: string, file: string, rootDir: string, failures: Failure[]): string {
  const written = statSync(join(rootDir, file)).mtime.toISOString();
  const entries = failures.map((failure) => [`- **${failure.title}** — ${failure.where}`, `  ${failure.message}`, ...failure.evidence.map((line) => `  ${line}`)].join('\n'));
  return [`## ${label} — ${file} (written ${written})`, '', ...entries].join('\n');
}

/** RF-96: the Markdown failure report, secrets redacted; always exit code 0. */
export function failureReport(options: FailureReportOptions): { exitCode: number; output: string } {
  const env = loadEnv({ processEnv: options.processEnv, dotenvPath: join(options.rootDir, DEFAULT_DOTENV_FILE) });
  const secrets = getSensitiveValues(env);
  const hide = (text: string) => redact(text, secrets).replace(new RegExp(JWT_SHAPE.source, 'g'), REDACTED);

  if (options.run !== undefined) {
    const gh = options.gh ?? (() => ({ status: 1, stdout: '', stderr: 'the GitHub CLI is not available' }));
    return { exitCode: SUCCESS, output: hide(githubRunReport(options.run, gh)) };
  }

  const sources = [
    { label: 'Playwright', file: JSON_REPORT_FILE, read: playwrightFailures },
    { label: 'Vitest', file: UNIT_RESULTS_FILE, read: vitestFailures },
  ];
  const missing = sources.filter((source) => !existsSync(join(options.rootDir, source.file))).map((source) => source.file);
  const sections = sources
    .filter((source) => !missing.includes(source.file))
    .map((source) => ({ ...source, failures: source.read(readFileSync(join(options.rootDir, source.file), 'utf8'), options.rootDir) }))
    .filter((source) => source.failures.length > 0)
    .map((source) => renderSection(source.label, source.file, options.rootDir, source.failures));
  if (sections.length > 0) return { exitCode: SUCCESS, output: hide(sections.join('\n\n')) };
  const none = `No failed tests found in ${sources.map((source) => source.file).join(', ')}`;
  return { exitCode: SUCCESS, output: missing.length === 0 ? none : `${none}\nMissing: ${missing.join(', ')}` };
}

function main(): void {
  const { values } = parseArgs({ options: { run: { type: 'string' } } });
  const gh: GhRunner = (args) => {
    const result = spawnSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return result.error === undefined ? result : { status: 1, stdout: '', stderr: 'the GitHub CLI (gh) is not installed or not on PATH' };
  };
  const result = failureReport({ rootDir: process.cwd(), processEnv: process.env, run: values.run, gh });
  console.log(result.output);
  process.exitCode = result.exitCode;
}

if (require.main === module) main();
