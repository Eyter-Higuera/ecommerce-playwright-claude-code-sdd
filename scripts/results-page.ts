import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SpecCoverage } from './spec-check/summary';
import { MAX_FAILED_TITLES, formatDuration, type CoverageTotals, type StageSummary } from './test-summary';

// Results page (Spec 000, RF-88). The `publish-results` job of a push run calls it
// (`npm run report:pages`) after downloading the `summary-<job>` artifacts of the run. It reads the
// results.json published before, replaces this branch's entry with this run (commit, run link,
// UTC date, overall result and one row per stage), keeps the other branches' entries, and writes
// `reports/pages/index.html` and `reports/pages/results.json` for GitHub Pages. A 404 means nothing
// was published yet; any other failed read stops the build and writes nothing, so a deploy can
// never drop the other branches. Everything shown comes from data and is HTML-escaped.

export const BRANCHES = ['eyter_dev', 'release', 'main', 'production'] as const;
export type Branch = (typeof BRANCHES)[number];
/** UI browsers of each branch, in chain order (RF-58, RF-69 to RF-71, RF-83). */
const UI_BROWSERS: Record<Branch, string[]> = {
  eyter_dev: ['chromium'],
  release: ['chromium', 'firefox', 'webkit'],
  main: ['chromium', 'firefox', 'webkit'],
  production: ['chromium'],
};
const CHECKS_JOB = 'checks';
const UNIT_JOB = 'unit-tests';
const SUMMARY_ARTIFACT_PREFIX = 'summary-';
const SUMMARY_FILE = 'summary.json';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const SHORT_SHA_LENGTH = 7;
const COVERAGE_DECIMALS = 2;
const SUCCESS = 0;
const FAILURE = 1;

export const DEFAULT_SUMMARIES_DIR = 'reports/summaries';
export const DEFAULT_OUT_DIR = 'reports/pages';

export type StageStatus = 'passed' | 'failed' | 'canceled' | 'not run';

export interface PageStage {
  job: string;
  stage: string;
  status: StageStatus;
  passed?: number;
  failed?: number;
  skipped?: number;
  flaky?: number;
  durationMs?: number;
  failedTitles?: string[];
  coverage?: CoverageTotals;
}

export interface BranchEntry {
  branch: Branch;
  commit: string;
  commitUrl: string;
  runUrl: string;
  /** UTC, ISO 8601. */
  date: string;
  /** `passed` only when every stage passed (RF-88). */
  result: 'passed' | 'failed';
  stages: PageStage[];
  requirements?: SpecCoverage[];
}

export interface ResultsData {
  branches: Partial<Record<Branch, BranchEntry>>;
}

export interface RunInfo {
  branch: string;
  commit: string;
  serverUrl: string;
  repository: string;
  runId: string;
  now: Date;
}

/** The part of `fetch` the builder needs; injected so unit tests never use the network. */
export type Fetcher = (url: string) => Promise<{ status: number; text: () => Promise<string> }>;

export interface PageOptions {
  fetcher: Fetcher;
  resultsUrl: string;
  summariesDir: string;
  outDir: string;
  /** `needs.<job>.result` of every job the publish job waited for. */
  jobResults: Record<string, string>;
  run: RunInfo;
}

type Summary = StageSummary | { stage: string; specs: SpecCoverage[] };

const isBranch = (value: string): value is Branch => (BRANCHES as readonly string[]).includes(value);

/** The jobs of a branch's push run, in chain order, with the stage name shown when no summary exists. */
export function stagesOf(branch: Branch): { job: string; stage: string }[] {
  const prefix = branch.replace('_', '-');
  return [
    { job: CHECKS_JOB, stage: 'Requirements coverage' },
    { job: UNIT_JOB, stage: 'Unit tests' },
    { job: `${prefix}-api`, stage: 'API' },
    ...UI_BROWSERS[branch].map((browser) => ({ job: `${prefix}-ui-${browser}`, stage: `UI ${browser}` })),
  ];
}

function statusOf(jobResult: string | undefined): StageStatus {
  if (jobResult === 'success') return 'passed';
  if (jobResult === 'failure') return 'failed';
  if (jobResult === 'cancelled') return 'canceled';
  return 'not run';
}

/** The `summary-<job>/summary.json` files downloaded by actions/download-artifact. */
export function readSummaries(summariesDir: string): Map<string, Summary> {
  const summaries = new Map<string, Summary>();
  if (!existsSync(summariesDir)) return summaries;
  for (const entry of readdirSync(summariesDir, { withFileTypes: true })) {
    const file = join(summariesDir, entry.name, SUMMARY_FILE);
    if (entry.isDirectory() && entry.name.startsWith(SUMMARY_ARTIFACT_PREFIX) && existsSync(file)) {
      summaries.set(entry.name.slice(SUMMARY_ARTIFACT_PREFIX.length), JSON.parse(readFileSync(file, 'utf8')) as Summary);
    }
  }
  return summaries;
}

/** RF-88: this run's entry for its branch; stages without a job result are "not run". */
export function branchEntry(branch: Branch, run: RunInfo, jobResults: Record<string, string>, summaries: Map<string, Summary>): BranchEntry {
  let requirements: SpecCoverage[] | undefined;
  const stages = stagesOf(branch).map(({ job, stage }): PageStage => {
    const status = statusOf(jobResults[job]);
    const summary = summaries.get(job);
    if (summary === undefined || status === 'not run') return { job, stage, status };
    if ('specs' in summary) {
      requirements = summary.specs;
      return { job, stage: summary.stage, status };
    }
    if (!summary.known) return { job, stage: summary.stage, status };
    const { passed, failed, skipped, flaky, durationMs, failedTitles, coverage } = summary;
    return { job, stage: summary.stage, status, passed, failed, skipped, flaky, durationMs, failedTitles, ...(coverage === undefined ? {} : { coverage }) };
  });
  const repositoryUrl = `${run.serverUrl}/${run.repository}`;
  return {
    branch,
    commit: run.commit,
    commitUrl: `${repositoryUrl}/commit/${run.commit}`,
    runUrl: `${repositoryUrl}/actions/runs/${run.runId}`,
    date: run.now.toISOString(),
    result: stages.every((stage) => stage.status === 'passed') ? 'passed' : 'failed',
    stages,
    ...(requirements === undefined ? {} : { requirements }),
  };
}

/** RF-88: the published results with this branch's entry replaced; the other branches are kept. */
export function mergeResults(previous: ResultsData | undefined, entry: BranchEntry): ResultsData {
  return { branches: { ...(previous?.branches ?? {}), [entry.branch]: entry } };
}

/** The published results, `undefined` before the first publication (404); throws on any other failure. */
export async function fetchPrevious(url: string, fetcher: Fetcher): Promise<ResultsData | undefined> {
  let response: Awaited<ReturnType<Fetcher>>;
  try {
    response = await fetcher(url);
  } catch (error) {
    throw new Error(`Cannot read ${url}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  if (response.status === HTTP_NOT_FOUND) return undefined;
  if (response.status !== HTTP_OK) throw new Error(`Cannot read ${url}: HTTP ${String(response.status)}`);
  return JSON.parse(await response.text()) as ResultsData;
}

// --- HTML -------------------------------------------------------------------------------------

/** Every value on the page is data: shown as text, never as markup (TC-000-131). */
export function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const cell = (value: number | undefined) => (value === undefined ? '—' : String(value));
const percent = (value: number) => `${value.toFixed(COVERAGE_DECIMALS)} %`;

function renderStage(stage: PageStage): string {
  const coverage = stage.coverage === undefined ? '' : `<div class="coverage">Coverage: lines ${percent(stage.coverage.lines)} · branches ${percent(stage.coverage.branches)} · functions ${percent(stage.coverage.functions)} · statements ${percent(stage.coverage.statements)}</div>`;
  const titles = stage.failedTitles ?? [];
  const hidden = titles.length - MAX_FAILED_TITLES;
  const failed = titles.length === 0 ? '' : `<ul class="failed">${titles.slice(0, MAX_FAILED_TITLES).map((title) => `<li>${escapeHtml(title)}</li>`).join('')}${hidden > 0 ? `<li>and ${String(hidden)} more</li>` : ''}</ul>`;
  return `<tr><td>${escapeHtml(stage.stage)}${coverage}${failed}</td><td><span class="status ${stage.status.replace(' ', '-')}">${escapeHtml(stage.status)}</span></td>` +
    `<td>${cell(stage.passed)}</td><td>${cell(stage.failed)}</td><td>${cell(stage.skipped)}</td><td>${cell(stage.flaky)}</td>` +
    `<td>${stage.durationMs === undefined ? '—' : formatDuration(stage.durationMs)}</td></tr>`;
}

function renderRequirements(specs: SpecCoverage[]): string {
  const rows = specs.map((spec) => `<tr><td>${escapeHtml(spec.spec)}</td><td>${String(spec.rfs)}</td><td>${String(spec.testCases)}</td><td>${String(spec.automated)}</td><td>${String(spec.manual)}</td><td>${String(spec.skipped)}</td><td>${String(spec.missing)}</td></tr>`).join('');
  return `<h3>Requirements coverage</h3><table><thead><tr><th>Spec</th><th>RFs</th><th>Test cases</th><th>Automated</th><th>Manual</th><th>Skipped</th><th>Missing</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderBranch(branch: Branch, entry: BranchEntry | undefined): string {
  if (entry === undefined) return `<section><h2>${branch}</h2><p class="muted">no run yet</p></section>`;
  const stages = entry.stages.map(renderStage).join('');
  return `<section><h2>${escapeHtml(entry.branch)} <span class="status ${entry.result}">${entry.result}</span></h2>` +
    `<p class="muted">Commit <a href="${escapeHtml(entry.commitUrl)}">${escapeHtml(entry.commit.slice(0, SHORT_SHA_LENGTH))}</a> · <a href="${escapeHtml(entry.runUrl)}">workflow run</a> · ${escapeHtml(entry.date)}</p>` +
    `<table><thead><tr><th>Stage</th><th>Status</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Flaky</th><th>Duration</th></tr></thead><tbody>${stages}</tbody></table>` +
    `${entry.requirements === undefined ? '' : renderRequirements(entry.requirements)}</section>`;
}

const STYLE = `:root{--bg:#fff;--fg:#1f2328;--muted:#59636e;--line:#d1d9e0;--ok:#1a7f37;--bad:#cf222e;--off:#6e7781}
@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--muted:#9198a1;--line:#3d444d;--ok:#3fb950;--bad:#f85149;--off:#9198a1}}
body{margin:0 auto;max-width:960px;padding:16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
a{color:inherit}table{border-collapse:collapse;width:100%;margin:8px 0 16px;display:block;overflow-x:auto}
th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
.muted,.coverage{color:var(--muted);font-size:13px}.failed{margin:4px 0;padding-left:18px;font-size:13px}
.status{font-size:12px;font-weight:600;padding:1px 8px;border-radius:10px;border:1px solid currentColor}
.passed{color:var(--ok)}.failed .status,.status.failed,.status.canceled{color:var(--bad)}.not-run{color:var(--off)}`;

/** RF-88: the whole page, one section per promotion branch. No script, every value escaped. */
export function renderPage(data: ResultsData): string {
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Test results</title><style>${STYLE}</style></head><body><h1>Test results</h1>` +
    `<p class="muted">Latest push run of each branch: eyter_dev → release → main → production.</p>` +
    `${BRANCHES.map((branch) => renderBranch(branch, data.branches[branch])).join('\n')}</body></html>\n`;
}

// --- Run --------------------------------------------------------------------------------------

/** RF-88: reads the published results, merges this run and writes the page; exit 1 writes nothing. */
export async function buildResultsPage(options: PageOptions): Promise<{ exitCode: number; output: string }> {
  if (!isBranch(options.run.branch)) return { exitCode: FAILURE, output: `Not a promotion branch: ${options.run.branch}` };
  let previous: ResultsData | undefined;
  try {
    previous = await fetchPrevious(options.resultsUrl, options.fetcher);
  } catch (error) {
    return { exitCode: FAILURE, output: error instanceof Error ? error.message : String(error) };
  }
  const entry = branchEntry(options.run.branch, options.run, options.jobResults, readSummaries(options.summariesDir));
  const data = mergeResults(previous, entry);
  mkdirSync(options.outDir, { recursive: true });
  writeFileSync(join(options.outDir, 'results.json'), `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(join(options.outDir, 'index.html'), renderPage(data));
  return { exitCode: SUCCESS, output: `Results page: ${entry.branch} ${entry.result} (${previous === undefined ? 'first publication' : 'other branches kept'})` };
}

/** The Pages URL of results.json for `owner/repo` (project site). */
export function defaultResultsUrl(repository: string): string {
  const [owner = '', repo = ''] = repository.split('/');
  return `https://${owner.toLowerCase()}.github.io/${repo}/results.json`;
}

async function main(): Promise<void> {
  const env = process.env;
  const repository = env.GITHUB_REPOSITORY ?? '';
  const needs = JSON.parse(env.NEEDS_JSON ?? '{}') as Record<string, { result?: string }>;
  const result = await buildResultsPage({
    fetcher: (url) => fetch(url),
    resultsUrl: env.RESULTS_URL ?? defaultResultsUrl(repository),
    summariesDir: DEFAULT_SUMMARIES_DIR,
    outDir: DEFAULT_OUT_DIR,
    jobResults: Object.fromEntries(Object.entries(needs).map(([job, value]) => [job, value.result ?? ''])),
    run: { branch: env.GITHUB_REF_NAME ?? '', commit: env.GITHUB_SHA ?? '', serverUrl: env.GITHUB_SERVER_URL ?? 'https://github.com', repository, runId: env.GITHUB_RUN_ID ?? '', now: new Date() },
  });
  console.log(result.output);
  process.exitCode = result.exitCode;
}

if (require.main === module) void main();
