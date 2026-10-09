import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { JSON_REPORT_FILE } from '../src/config/playwright-options';

// Test summary (Spec 000, RF-84, RF-85 and RF-87). CI runs it after the tests of every unit, API,
// UI and manual job (`npm run report:summary -- --title <stage> [--report <file>] [--coverage
// <file>]`). It reads a Playwright or Vitest JSON results file, prints a table of passed / failed /
// skipped / flaky tests, the total and the wall-clock duration, then the failed titles, plus the
// code coverage totals when a coverage summary exists, and appends the same Markdown to the GitHub
// job summary (GITHUB_STEP_SUMMARY) when one is available. It also saves the numbers to
// `reports/summary.json` for the results page (RF-88). A missing results file is reported, never a
// reason to fail the job.

/** RF-84: failed titles listed in a summary; the rest are counted, so the summary stays small. */
export const MAX_FAILED_TITLES = 50;
/** Where the summary numbers are saved for the results page (RF-88); inside the scanned `reports/`. */
export const SUMMARY_JSON_FILE = 'reports/summary.json';
/** The `json-summary` report of the unit coverage (vitest.config.mts, RF-85). */
export const COVERAGE_SUMMARY_FILE = 'reports/coverage/coverage-summary.json';
const COVERAGE_DECIMALS = 2;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SUCCESS = 0;

export interface StageSummary {
  stage: string;
  /** False when the results file did not exist (RF-87). */
  known: boolean;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  total: number;
  durationMs: number;
  failedTitles: string[];
  /** Code coverage totals in percent, only for the unit stage (RF-85). */
  coverage?: CoverageTotals;
}

export interface CoverageTotals {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface SummaryOptions {
  stage: string;
  reportPath: string;
  /** A coverage `json-summary` file; ignored when it does not exist. */
  coveragePath?: string;
  /** Where the numbers are saved (default `reports/summary.json`). */
  summaryJsonPath?: string;
  /** The GitHub job summary file; undefined outside GitHub Actions. */
  stepSummaryPath?: string;
}

// --- Results formats --------------------------------------------------------------------------

interface PlaywrightSuite {
  specs?: { title: string; tests?: { status?: string }[] }[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightReport extends PlaywrightSuite {
  stats: { duration?: number; expected?: number; unexpected?: number; skipped?: number; flaky?: number };
}

interface VitestReport {
  numTotalTests: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  numTodoTests?: number;
  startTime?: number;
  testResults?: { endTime?: number; assertionResults?: { title: string; status?: string }[] }[];
}

/** Titles of the Playwright specs with at least one unexpected (failed) result, in report order. */
function playwrightFailedTitles(suite: PlaywrightSuite): string[] {
  const own = (suite.specs ?? []).filter((spec) => (spec.tests ?? []).some((test) => test.status === 'unexpected')).map((spec) => spec.title);
  return [...own, ...(suite.suites ?? []).flatMap(playwrightFailedTitles)];
}

function fromPlaywright(stage: string, report: PlaywrightReport): StageSummary {
  const { expected = 0, unexpected = 0, skipped = 0, flaky = 0, duration = 0 } = report.stats;
  // A flaky test passed in the end: it counts as passed and also in its own column (RF-84).
  const passed = expected + flaky;
  return {
    stage, known: true, passed, failed: unexpected, skipped, flaky,
    total: passed + unexpected + skipped, durationMs: duration, failedTitles: playwrightFailedTitles(report),
  };
}

function fromVitest(stage: string, report: VitestReport): StageSummary {
  const passed = report.numPassedTests ?? 0;
  const failed = report.numFailedTests ?? 0;
  const skipped = (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0);
  const files = report.testResults ?? [];
  // Wall-clock: from the run start to the end of the last file (files run in parallel).
  const lastEnd = Math.max(...files.map((file) => file.endTime ?? 0), report.startTime ?? 0);
  return {
    stage, known: true, passed, failed, skipped, flaky: 0, total: passed + failed + skipped,
    durationMs: report.startTime === undefined ? 0 : lastEnd - report.startTime,
    failedTitles: files.flatMap((file) => (file.assertionResults ?? []).filter((test) => test.status === 'failed').map((test) => test.title)),
  };
}

/** RF-84: the stage summary of a Playwright or Vitest JSON results text. */
export function summarizeResults(stage: string, resultsText: string): StageSummary {
  const report = JSON.parse(resultsText) as Partial<PlaywrightReport & VitestReport>;
  if (typeof report.numTotalTests === 'number') return fromVitest(stage, report as VitestReport);
  if (report.stats !== undefined) return fromPlaywright(stage, report as PlaywrightReport);
  throw new Error('Unknown results format: expected a Playwright or Vitest JSON report');
}

/** RF-85: the totals of a coverage `json-summary` report. */
export function readCoverageTotals(coverageText: string): CoverageTotals {
  const { total } = JSON.parse(coverageText) as { total: Record<keyof CoverageTotals, { pct: number }> };
  return { lines: total.lines.pct, branches: total.branches.pct, functions: total.functions.pct, statements: total.statements.pct };
}

// --- Rendering --------------------------------------------------------------------------------

/** RF-85: the coverage totals as a Markdown table. */
export function renderCoverage(coverage: CoverageTotals): string {
  const percent = (value: number) => `${value.toFixed(COVERAGE_DECIMALS)} %`;
  return [
    '**Code coverage**',
    '',
    '| Lines | Branches | Functions | Statements |',
    '|------:|---------:|----------:|-----------:|',
    `| ${percent(coverage.lines)} | ${percent(coverage.branches)} | ${percent(coverage.functions)} | ${percent(coverage.statements)} |`,
    '',
  ].join('\n');
}

/** Duration as mm:ss (minutes may exceed 59). */
export function formatDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / MS_PER_SECOND);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(seconds / SECONDS_PER_MINUTE))}:${pad(seconds % SECONDS_PER_MINUTE)}`;
}

/** The message of a stage whose results file is missing (RF-87). */
export function unknownResultsMessage(reportPath: string): string {
  return `Results unknown (no report at ${reportPath})`;
}

/** RF-84: Markdown table, then the failed titles (at most MAX_FAILED_TITLES). */
export function renderSummary(summary: StageSummary): string {
  const lines = [
    `### ${summary.stage}`,
    '',
    '| Stage | Passed | Failed | Skipped | Flaky | Total | Duration |',
    '|-------|-------:|-------:|--------:|------:|------:|---------:|',
    `| ${summary.stage} | ${String(summary.passed)} | ${String(summary.failed)} | ${String(summary.skipped)} | ${String(summary.flaky)} | ${String(summary.total)} | ${formatDuration(summary.durationMs)} |`,
  ];
  if (summary.failedTitles.length > 0) {
    lines.push('', '**Failed tests**', '', ...summary.failedTitles.slice(0, MAX_FAILED_TITLES).map((title) => `- ${title}`));
    const hidden = summary.failedTitles.length - MAX_FAILED_TITLES;
    if (hidden > 0) lines.push(`- and ${String(hidden)} more`);
  }
  const table = `${lines.join('\n')}\n`;
  return summary.coverage === undefined ? table : `${table}\n${renderCoverage(summary.coverage)}`;
}

// --- Run --------------------------------------------------------------------------------------

function unknownSummary(stage: string): StageSummary {
  return { stage, known: false, passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0, durationMs: 0, failedTitles: [] };
}

/** RF-84 / RF-87: builds the summary, saves it, appends it to the job summary; never fails the job. */
export function runSummary(options: SummaryOptions): { exitCode: number; output: string; summary: StageSummary } {
  const known = existsSync(options.reportPath);
  const summary = known ? summarizeResults(options.stage, readFileSync(options.reportPath, 'utf8')) : unknownSummary(options.stage);
  if (known && options.coveragePath !== undefined && existsSync(options.coveragePath)) {
    summary.coverage = readCoverageTotals(readFileSync(options.coveragePath, 'utf8'));
  }
  const output = known ? renderSummary(summary) : `### ${options.stage}\n\n${unknownResultsMessage(options.reportPath)}\n`;
  const summaryJsonPath = options.summaryJsonPath ?? SUMMARY_JSON_FILE;
  mkdirSync(dirname(summaryJsonPath), { recursive: true });
  writeFileSync(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  if (options.stepSummaryPath !== undefined && options.stepSummaryPath !== '') appendFileSync(options.stepSummaryPath, `${output}\n`);
  return { exitCode: SUCCESS, output, summary };
}

function main(): void {
  const { values } = parseArgs({ options: { title: { type: 'string' }, report: { type: 'string' }, coverage: { type: 'string' } } });
  if (values.title === undefined) throw new Error('Missing --title <stage>');
  const result = runSummary({
    stage: values.title,
    reportPath: values.report ?? JSON_REPORT_FILE,
    coveragePath: values.coverage,
    stepSummaryPath: process.env.GITHUB_STEP_SUMMARY,
  });
  console.log(result.output);
  process.exitCode = result.exitCode;
}

if (require.main === module) main();
