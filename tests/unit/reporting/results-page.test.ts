import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildResultsPage, type Fetcher, type ResultsData } from '../../../scripts/results-page';
import { fixturePath, makeEmptyDir } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-88: after the test jobs of a push run, the results page is
// rebuilt from the previously published results.json plus this run's job summaries and job
// results, replacing only this branch's entry. A failed read of the published results (other than
// 404) fails the build and writes nothing. Data is shown as escaped text. The published results are
// read through a stub fetcher: unit tests make no real HTTP calls.
const PREVIOUS_RESULTS = fixturePath('reports', 'pages', 'previous-results.json');
const RESULTS_URL = 'https://TEST_owner.github.io/TEST_repo/results.json';
const RUN_DATE = new Date('2026-10-09T12:34:56.000Z');
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVER_ERROR = 500;

const fetcherReturning = (status: number, body = ''): Fetcher => () => Promise.resolve({ status, text: () => Promise.resolve(body) });

interface RunFixture {
  branch: string;
  /** Job name → its `needs.<job>.result` (success, failure, cancelled, skipped). */
  jobResults: Record<string, string>;
  /** Job name → the content of its `summary-<job>/summary.json` artifact. */
  summaries: Record<string, object>;
}

/** Writes the downloaded summary artifacts the way actions/download-artifact lays them out. */
function writeSummaries(summaries: Record<string, object>): string {
  const dir = makeEmptyDir('TEST_summaries_');
  for (const [job, summary] of Object.entries(summaries)) {
    mkdirSync(join(dir, `summary-${job}`));
    writeFileSync(join(dir, `summary-${job}`, 'summary.json'), JSON.stringify(summary));
  }
  return dir;
}

async function build(run: RunFixture, fetcher: Fetcher) {
  const outDir = join(makeEmptyDir('TEST_pages_'), 'pages');
  const result = await buildResultsPage({
    fetcher,
    resultsUrl: RESULTS_URL,
    summariesDir: writeSummaries(run.summaries),
    outDir,
    jobResults: run.jobResults,
    run: { branch: run.branch, commit: 'abcdef1234567890abcdef1234567890abcdef12', serverUrl: 'https://github.com', repository: 'TEST_owner/TEST_repo', runId: '303', now: RUN_DATE },
  });
  return { ...result, outDir };
}

const testsSummary = (stage: string, counts: Partial<Record<'passed' | 'failed' | 'skipped' | 'flaky', number>>, failedTitles: string[] = []) => {
  const { passed = 0, failed = 0, skipped = 0, flaky = 0 } = counts;
  return { stage, known: true, passed, failed, skipped, flaky, total: passed + failed + skipped, durationMs: 61_000, failedTitles };
};
const requirementsSummary = { stage: 'Requirements coverage', specs: [{ spec: '000', rfs: 89, testCases: 132, automated: 119, manual: 13, skipped: 0, missing: 0 }] };

/** An eyter_dev run where the checks, unit and API jobs passed and UI chromium failed. */
const EYTER_DEV_RUN: RunFixture = {
  branch: 'eyter_dev',
  jobResults: { checks: 'success', 'unit-tests': 'success', 'eyter-dev-api': 'success', 'eyter-dev-ui-chromium': 'failure', 'release-api': 'skipped' },
  summaries: {
    checks: requirementsSummary,
    'unit-tests': { ...testsSummary('Unit tests', { passed: 111 }), coverage: { lines: 52.43, branches: 54.54, functions: 39.49, statements: 51.97 } },
    'eyter-dev-api': testsSummary('API @smoke', { passed: 1 }),
    'eyter-dev-ui-chromium': testsSummary('UI chromium @smoke', { passed: 1, failed: 1, flaky: 1 }, ['TC-001-05 shows the error message']),
  },
};

describe('Results page — positive', () => {
  it('TC-000-128 results page updates one branch and keeps the others', async () => {
    // Arrange: release and main were published before.
    const previous = readFileSync(PREVIOUS_RESULTS, 'utf8');

    // Act
    const { exitCode, outDir } = await build(EYTER_DEV_RUN, fetcherReturning(HTTP_OK, previous));

    // Assert: eyter_dev is replaced with this run (failed: one stage failed), release and main are
    // kept as they were, production has no run yet; both files are written.
    expect(exitCode).toBe(0);
    const data = JSON.parse(readFileSync(join(outDir, 'results.json'), 'utf8')) as ResultsData;
    const before = JSON.parse(previous) as ResultsData;
    expect(data.branches.release).toEqual(before.branches.release);
    expect(data.branches.main).toEqual(before.branches.main);
    expect(data.branches.production).toBeUndefined();
    const entry = data.branches.eyter_dev;
    expect(entry).toMatchObject({
      branch: 'eyter_dev',
      commit: 'abcdef1234567890abcdef1234567890abcdef12',
      commitUrl: 'https://github.com/TEST_owner/TEST_repo/commit/abcdef1234567890abcdef1234567890abcdef12',
      runUrl: 'https://github.com/TEST_owner/TEST_repo/actions/runs/303',
      date: '2026-10-09T12:34:56.000Z',
      result: 'failed',
    });
    expect(entry?.stages.map((stage) => [stage.job, stage.status])).toEqual([
      ['checks', 'passed'], ['unit-tests', 'passed'], ['eyter-dev-api', 'passed'], ['eyter-dev-ui-chromium', 'failed'],
    ]);
    expect(entry?.stages[1]).toMatchObject({ passed: 111, coverage: { lines: 52.43 } });
    expect(entry?.stages[3]).toMatchObject({ passed: 1, failed: 1, skipped: 0, flaky: 1, durationMs: 61_000, failedTitles: ['TC-001-05 shows the error message'] });
    expect(entry?.requirements).toEqual(requirementsSummary.specs);
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    for (const text of ['eyter_dev', 'release', 'main', 'production', 'no run yet', 'failed', '52.43 %', '01:01', 'actions/runs/303', '2026-10-09T12:34:56.000Z']) expect(html, text).toContain(text);
  });
});

describe('Results page — boundary', () => {
  it('TC-000-129 results page shows stages that did not run and handles the first publication', async () => {
    // Arrange: nothing published yet (404); a release run whose API job failed, so the UI jobs were skipped.
    const run: RunFixture = {
      branch: 'release',
      jobResults: { checks: 'success', 'unit-tests': 'success', 'release-api': 'failure', 'release-ui-chromium': 'skipped', 'release-ui-firefox': 'skipped', 'release-ui-webkit': 'skipped' },
      summaries: { checks: requirementsSummary, 'unit-tests': testsSummary('Unit tests', { passed: 111 }), 'release-api': testsSummary('API @regression', { passed: 3, failed: 1 }) },
    };

    // Act
    const { exitCode, outDir } = await build(run, fetcherReturning(HTTP_NOT_FOUND));

    // Assert: the missing stages are "not run", never invented; the other branches have no run yet.
    expect(exitCode).toBe(0);
    const data = JSON.parse(readFileSync(join(outDir, 'results.json'), 'utf8')) as ResultsData;
    expect(Object.keys(data.branches)).toEqual(['release']);
    expect(data.branches.release?.result).toBe('failed');
    expect(data.branches.release?.stages.map((stage) => [stage.job, stage.status])).toEqual([
      ['checks', 'passed'], ['unit-tests', 'passed'], ['release-api', 'failed'],
      ['release-ui-chromium', 'not run'], ['release-ui-firefox', 'not run'], ['release-ui-webkit', 'not run'],
    ]);
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html.match(/no run yet/g)).toHaveLength(3);
    expect(html).toContain('not run');
  });
});

describe('Results page — security', () => {
  it('TC-000-131 results page escapes test titles', async () => {
    // Arrange: a failed title with HTML characters.
    const title = 'TC-999-01 <script>alert(1)</script> & "quotes"';
    const run: RunFixture = { ...EYTER_DEV_RUN, summaries: { ...EYTER_DEV_RUN.summaries, 'eyter-dev-ui-chromium': testsSummary('UI chromium @smoke', { failed: 1 }, [title]) } };

    // Act
    const { outDir } = await build(run, fetcherReturning(HTTP_NOT_FOUND));

    // Assert: shown as text; the page contains no script element at all.
    const html = readFileSync(join(outDir, 'index.html'), 'utf8');
    expect(html).toContain('TC-999-01 &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;');
    expect(html).not.toContain('<script');
  });
});

describe('Results page — negative', () => {
  it('TC-000-134 results page fails without deploying when the published results cannot be read', async () => {
    // Arrange: the published results answer HTTP 500, then the network fails.
    const networkDown: Fetcher = () => Promise.reject(new Error('getaddrinfo ENOTFOUND TEST_owner.github.io'));

    // Act
    const serverError = await build(EYTER_DEV_RUN, fetcherReturning(HTTP_SERVER_ERROR));
    const unreachable = await build(EYTER_DEV_RUN, networkDown);

    // Assert: the build fails naming the URL and the reason, and writes nothing to deploy, so the
    // other branches' published entries are never lost.
    expect(serverError.exitCode).not.toBe(0);
    expect(serverError.output).toContain(`Cannot read ${RESULTS_URL}: HTTP 500`);
    expect(unreachable.exitCode).not.toBe(0);
    expect(unreachable.output).toContain(`Cannot read ${RESULTS_URL}: getaddrinfo ENOTFOUND TEST_owner.github.io`);
    for (const result of [serverError, unreachable]) expect(existsSync(result.outDir) ? readdirSync(result.outDir) : []).toEqual([]);
  });
});
