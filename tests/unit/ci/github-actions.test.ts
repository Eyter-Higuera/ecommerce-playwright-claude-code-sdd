import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findEnvPrinting } from '../../../scripts/check-ci-scripts';
import { lockedPlaywrightVersion, playwrightImages } from '../../../scripts/lib/playwright-version';
import { REPO_ROOT, fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-58 to RF-83: the GitHub Actions workflow runs the checks, the
// unit tests and each branch's API and UI jobs as a chain of separate jobs, scans secrets before
// publishing artifacts, offers the manual SUITE/BROWSER run, and promotes a green commit to the next
// branch. The workflow is read as text (no YAML dependency is approved) and split into its jobs.
// RF-65: CI must never print the environment.
const WORKFLOW_FILE = join(REPO_ROOT, '.github', 'workflows', 'ci.yml');
const PRINT_ENV_FIXTURE = fixturePath('ci', 'print-env', 'ci.yml');
const PROMOTION_BRANCHES = ['eyter_dev', 'release', 'main', 'production'];
const CHECK_TASKS = ['spec:check', 'lint', 'typecheck'];
const CHECKS_JOB = 'checks';
const UNIT_JOB = 'unit-tests';
const SECRET_NAMES = ['BASE_URL', 'API_BASE_URL', 'TEST_USER_EMAIL', 'TEST_USER_PASSWORD', 'TEST_USER_2_EMAIL', 'TEST_USER_2_PASSWORD', 'PROMOTION_TOKEN', 'GITHUB_TOKEN'];

interface PushGate {
  branch: string;
  command: string;
  /** The one job this gate waits for (RF-83). */
  needs: string;
}

/** One branch's chain (RF-83): the API job after the unit tests, then one UI job per browser, each after the previous one. */
function gateChain(branch: string, prefix: string, tag: string, browsers: string[]): Record<string, PushGate> {
  const projects = ['api', ...browsers];
  const names = projects.map((project) => `${prefix}-${project === 'api' ? 'api' : `ui-${project}`}`);
  const chain: Record<string, PushGate> = {};
  projects.forEach((project, index) => {
    chain[names[index] ?? ''] = { branch, command: `npx playwright test --grep ${tag} --project=${project}`, needs: index === 0 ? UNIT_JOB : (names[index - 1] ?? '') };
  });
  return chain;
}

/** Each push gate job: its branch, its test command and the job it needs (RF-58, RF-69 to RF-71, RF-83). */
const PUSH_GATES: Record<string, PushGate> = {
  ...gateChain('eyter_dev', 'eyter-dev', '@smoke', ['chromium']),
  ...gateChain('release', 'release', '@regression', ['chromium', 'firefox', 'webkit']),
  ...gateChain('main', 'main', '@smoke', ['chromium', 'firefox', 'webkit']),
  ...gateChain('production', 'production', '@smoke', ['chromium']),
};
/** RF-80 / RF-90: the manual run's API and UI jobs, and the LAYER each passes to ci:run-suite. */
const MANUAL_JOBS = { 'manual-api': { layer: 'api', needs: ['unit-tests'] }, 'manual-ui': { layer: 'ui', needs: ['unit-tests', 'manual-api'] } } as const;
const PLAYWRIGHT_JOBS = [...Object.keys(PUSH_GATES), ...Object.keys(MANUAL_JOBS)];
/** RF-92: the guard that refuses a regression started on a later branch. */
const REGRESSION_GUARD_IF = "if: github.event_name == 'workflow_dispatch' && inputs.suite == 'regression' && github.ref_name != 'eyter_dev' && !inputs.chained";
const REGRESSION_GUARD_MESSAGE = 'Regression starts from eyter_dev: run it there, it continues to release, main and production';
/** Jobs allowed to replace the default "previous jobs succeeded" condition, each for a documented reason. */
const CONDITION_EXCEPTIONS = ['promote', 'manual-ui', 'chain-next'];
const CHAIN_JOB = 'chain-next';
/** RF-84 to RF-86: the files the summary steps read and write. */
const UNIT_RESULTS = 'reports/unit-results.json';
const COVERAGE_SUMMARY = 'reports/coverage/coverage-summary.json';
const SUMMARY_FILE = 'reports/summary.json';
const SUMMARY_ARTIFACT = 'name: summary-${{ github.job }}';
const PUBLISH_JOB = 'publish-results';
/** RF-88: the only permissions beyond `contents: read`, and only for the publish job. */
const PAGES_PERMISSIONS = ['pages: write', 'id-token: write'];
const JOB_KEY = /^ {2}([\w-]+):\s*$/;
const SAFE_DIRECTORY = 'git config --global --add safe.directory "$GITHUB_WORKSPACE"';

const workflow = (): string => readFileSync(WORKFLOW_FILE, 'utf8');

/** The jobs of the workflow: name → its text (key line included). */
function jobsOf(content: string): Map<string, string> {
  const jobs = new Map<string, string>();
  let inJobs = false;
  let current: string | undefined;
  for (const line of content.split(/\r?\n/)) {
    if (/^jobs:\s*$/.test(line)) {
      inJobs = true;
      continue;
    }
    if (inJobs && /^\S/.test(line)) inJobs = false;
    if (!inJobs) continue;
    const key = JOB_KEY.exec(line)?.[1];
    if (key !== undefined) current = key;
    if (current !== undefined) jobs.set(current, `${jobs.get(current) ?? ''}${line}\n`);
  }
  return jobs;
}

/** The non-empty lines of a job, trimmed, in order. */
function lines(job: string): string[] {
  return job
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Index of the first line of `job` that contains `text` (-1 when absent). */
function lineIndex(job: string, text: string): number {
  return lines(job).findIndex((line) => line.includes(text));
}

/** Branch names a job's `if:` compares `github.ref_name` with. */
function branchesOf(job: string): string[] {
  return [...job.matchAll(/github\.ref_name == '([^']+)'/g)].map((match) => match[1] ?? '');
}

/** The jobs a job waits for: `needs: a` or `needs: [a, b]` (empty when it has none). */
function needsOf(job: string): string[] {
  const value = /^ {4}needs: (.+)$/m.exec(job)?.[1]?.trim();
  if (value === undefined) return [];
  return value.startsWith('[') ? value.slice(1, -1).split(',').map((name) => name.trim()) : [value];
}

/** The job-level `if:` condition (empty when the job has none). */
function conditionOf(job: string): string {
  return /^ {4}if: (.+)$/m.exec(job)?.[1] ?? '';
}

/** The gate jobs of one branch, in chain order. */
function gatesOf(branch: string): string[] {
  return Object.entries(PUSH_GATES)
    .filter(([, gate]) => gate.branch === branch)
    .map(([name]) => name);
}

/** RF-58, RF-69 to RF-71, RF-83: the gate job `name` runs its command on its branch, after the job it needs. */
function expectGate(jobs: Map<string, string>, name: string): void {
  const gate = PUSH_GATES[name];
  const text = jobs.get(name) ?? '';
  expect(gate, name).toBeDefined();
  expect(branchesOf(text), name).toEqual([gate?.branch]);
  expect(text, name).toContain("github.event_name == 'push'");
  expect(text, name).toContain(gate?.command);
  expect(needsOf(text), name).toEqual([gate?.needs]);
}

describe('GitHub workflow — positive', () => {
  it('TC-000-86 CI definition declares the gates, reports and artifacts', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const checks = jobs.get(CHECKS_JOB) ?? '';
    const unit = jobs.get(UNIT_JOB) ?? '';

    // Assert: a push on the four promotion branches triggers the workflow; the checks job runs
    // spec:check, lint and typecheck, and the unit tests run in their own job; the eyter_dev gate runs
    // the smoke suite on api, then on chromium (RF-58, RF-83); every job checks the code out and marks
    // the workspace safe for git (TC-000-30 runs git in the container).
    expect(content).toMatch(/push:\s*\n\s+branches: \[eyter_dev, release, main, production\]/);
    expect(checks).toContain(`task: [${CHECK_TASKS.join(', ')}]`);
    expect(checks).toContain('npm run ${{ matrix.task }}');
    expect(checks).not.toContain('test:unit');
    expect(unit).toContain('npm run test:unit');
    for (const name of gatesOf('eyter_dev')) expectGate(jobs, name);
    expect(gatesOf('eyter_dev')).toEqual(['eyter-dev-api', 'eyter-dev-ui-chromium']);
    for (const [name, text] of jobs) {
      const safeLine = lineIndex(text, SAFE_DIRECTORY);
      expect(safeLine, name).toBeGreaterThan(lineIndex(text, 'uses: actions/checkout@'));
      expect(safeLine, name).toBeLessThan(lineIndex(text, 'run: npm ci'));
    }
    // Reports: the flaky count is printed and the evidence kept 7 days, JUnit included (RF-51, RF-66, RF-67).
    for (const job of PLAYWRIGHT_JOBS) {
      const text = jobs.get(job) ?? '';
      for (const expected of ['npm run report:flaky', 'retention-days: 7', 'playwright-report/', 'reports/', 'test-results/']) expect(text, `${job}: ${expected}`).toContain(expected);
    }
  });

  it('TC-000-98 CI definition runs the release gate', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    // Act
    const names = gatesOf('release');

    // Assert: regression on api, then chromium, firefox and webkit, one job each (RF-69, RF-83).
    expect(names).toEqual(['release-api', 'release-ui-chromium', 'release-ui-firefox', 'release-ui-webkit']);
    for (const name of names) expectGate(jobs, name);
  });

  it('TC-000-99 CI definition runs the main gate', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    // Act
    const names = gatesOf('main');

    // Assert: smoke on api, then chromium, firefox and webkit, one job each (RF-70, RF-83).
    expect(names).toEqual(['main-api', 'main-ui-chromium', 'main-ui-firefox', 'main-ui-webkit']);
    for (const name of names) expectGate(jobs, name);
  });

  it('TC-000-100 CI definition runs the production sanity gate', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    // Act
    const names = gatesOf('production');

    // Assert: smoke on api, then chromium (RF-71, RF-83).
    expect(names).toEqual(['production-api', 'production-ui-chromium']);
    for (const name of names) expectGate(jobs, name);
  });

  it('TC-000-119 each push stage is a separate job that starts only after the previous one', () => {
    // Arrange
    const jobs = jobsOf(workflow());
    const checks = jobs.get(CHECKS_JOB) ?? '';

    // Act
    const needs = new Map([...jobs].map(([name, text]) => [name, needsOf(text)]));

    // Assert: checks first, a failing check cancels the others; then the unit job; then each branch
    // chain, every job needing exactly the previous one (RF-83); the manual run also waits for the
    // unit job (RF-80).
    expect(needs.get(CHECKS_JOB)).toEqual([]);
    expect(checks).toContain('fail-fast: true');
    expect(needs.get(UNIT_JOB)).toEqual([CHECKS_JOB]);
    for (const [name, job] of Object.entries(MANUAL_JOBS)) expect(needs.get(name), name).toEqual(job.needs);
    for (const [name, gate] of Object.entries(PUSH_GATES)) expect(needs.get(name), name).toEqual([gate.needs]);
    // No test job overrides the default "previous jobs succeeded" condition, so a failed or canceled
    // job skips every later one; only promote decides with !cancelled() && !failure(), and only the
    // publish job runs always(), after the test jobs, to report them (RF-88).
    for (const [name, text] of jobs) {
      if (CONDITION_EXCEPTIONS.includes(name) || name === PUBLISH_JOB) continue;
      expect(conditionOf(text), name).not.toMatch(/always\(\)|cancelled\(\)|failure\(\)/);
    }
    expect(conditionOf(jobs.get(PUBLISH_JOB) ?? '')).toContain('always()');
    for (const name of PLAYWRIGHT_JOBS) expect(jobs.get(name), name).not.toContain('npm run test:unit');
  });

  it('TC-000-115 GitHub manual run selects the suite through ci:run-suite', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const manualJobs = Object.keys(MANUAL_JOBS).map((name) => [name, jobs.get(name) ?? ''] as const);

    // Assert: the manual run offers the RF-60/RF-61 choices and passes them to the shared runner (RF-80).
    expect(content).toMatch(/workflow_dispatch:\s*\n\s+inputs:/);
    expect(content).toContain('options: [smoke, regression]');
    expect(content).toContain('options: [chromium, firefox, webkit, all]');
    for (const [name, text] of manualJobs) {
      expect(conditionOf(text), name).toContain("github.event_name == 'workflow_dispatch'");
      expect(text, name).toContain('SUITE: ${{ inputs.suite }}');
      expect(text, name).toContain('BROWSER: ${{ inputs.browser }}');
      expect(text, name).toContain('npm run ci:run-suite');
    }
  });

  it('TC-000-141 the manual run has a layer input and separate API and UI jobs', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const api = jobs.get('manual-api') ?? '';
    const ui = jobs.get('manual-ui') ?? '';

    // Assert: the layer and chained inputs (RF-90, RF-91); each manual job runs its layer only, the
    // UI job after the API job, and also when the API job was skipped (layer ui) but never after it
    // failed; layer unit stops after unit-tests; the old single job is gone (RF-80, RF-83).
    expect(content).toMatch(/ {6}layer:\s*\n(?: {8}.*\n)*? {8}options: \[all, unit, api, ui\]\s*\n {8}default: all/);
    expect(content).toMatch(/ {6}chained:\s*\n(?: {8}.*\n)*? {8}type: boolean\s*\n {8}default: false/);
    expect(conditionOf(api)).toBe("github.event_name == 'workflow_dispatch' && (inputs.layer == 'all' || inputs.layer == 'api')");
    expect(conditionOf(ui)).toBe("${{ !cancelled() && !failure() && github.event_name == 'workflow_dispatch' && (inputs.layer == 'all' || inputs.layer == 'ui') }}");
    for (const [name, job] of Object.entries(MANUAL_JOBS)) expect(jobs.get(name), name).toContain(`LAYER: ${job.layer}`);
    expect(jobs.has('run-suite')).toBe(false);
  });

  it('TC-000-127 CI jobs write their summaries before the secrets scan', () => {
    // Arrange
    const jobs = jobsOf(workflow());
    const checks = jobs.get(CHECKS_JOB) ?? '';
    const unit = jobs.get(UNIT_JOB) ?? '';

    // Act
    const testJobs = [UNIT_JOB, ...PLAYWRIGHT_JOBS];

    // Assert: the spec:check leg reports the requirements coverage (RF-86) and publishes it only
    // after a clean scan; the unit job measures coverage and summarizes it (RF-85).
    expect(checks).toMatch(/include:\s*\n\s+- task: spec:check\s*\n\s+args: -- --summary/);
    expect(checks).toContain('run: npm run ${{ matrix.task }} ${{ matrix.args }}');
    expect(lines(checks)[lineIndex(checks, 'run: npm run check:secrets') - 1]).toBe("if: always() && matrix.task == 'spec:check'");
    expect(lineIndex(checks, SUMMARY_ARTIFACT)).toBeGreaterThan(lineIndex(checks, 'run: npm run check:secrets'));
    expect(unit).toContain('run: npm run test:unit:ci');
    expect(unit).toContain(`--report ${UNIT_RESULTS} --coverage ${COVERAGE_SUMMARY}`);
    for (const job of testJobs) {
      const text = jobs.get(job) ?? '';
      const testLine = Math.max(lineIndex(text, 'npx playwright test'), lineIndex(text, 'npm run ci:run-suite'), lineIndex(text, 'run: npm run test:unit:ci'));
      const summaryLine = lineIndex(text, 'run: npm run report:summary -- --title ');
      const scanLine = lineIndex(text, 'run: npm run check:secrets');
      const summaryUpload = lineIndex(text, SUMMARY_ARTIFACT);
      // Every test job summarizes its run, passed or failed (RF-84), before the scan (RF-79) ...
      expect(testLine, job).toBeGreaterThanOrEqual(0);
      expect(summaryLine, job).toBeGreaterThan(testLine);
      expect(lines(text)[summaryLine - 1], job).toBe('- if: always()');
      expect(scanLine, job).toBeGreaterThan(summaryLine);
      // ... and publishes the summary for the results page only after a clean scan (RF-88).
      expect(summaryUpload, job).toBeGreaterThan(scanLine);
      expect(lines(text).slice(scanLine, summaryUpload).filter((line) => line.startsWith('- if:')).at(-1), job).toBe("- if: always() && steps.secrets.outcome == 'success'");
      expect(text, job).toContain(`path: ${SUMMARY_FILE}`);
    }
    // The unit job keeps its results and coverage report after the scan, like the Playwright jobs.
    expect(unit).toContain('name: ${{ github.job }}-reports');
  });

  it('TC-000-04 CI Playwright image version equals installed @playwright/test version', () => {
    // Arrange
    const locked = lockedPlaywrightVersion(readFileSync(join(REPO_ROOT, 'package-lock.json'), 'utf8'));

    // Act
    const versions = playwrightImages(workflow()).map((image) => image.version);

    // Assert: at least one image, and every image matches the locked library version (RF-2, RF-82).
    expect(locked).toBeDefined();
    expect(versions.length).toBeGreaterThan(0);
    expect(new Set(versions)).toEqual(new Set([locked]));
  });
});

describe('GitHub workflow — negative', () => {
  it('TC-000-87 each push gate runs only on its own branch', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const triggers = /\non:\s*\n((?: {2}\S.*\n|(?: {4,}).*\n)*)/.exec(content)?.[1] ?? '';
    const topTriggers = [...triggers.matchAll(/^ {2}([\w_]+):/gm)].map((match) => match[1]);
    const gateBranches = Object.keys(PUSH_GATES).flatMap((job) => branchesOf(jobs.get(job) ?? ''));

    // Assert: only push and workflow_dispatch trigger the workflow; the shared checks and unit jobs
    // have no branch condition; each gate names exactly its one branch, and together they cover the
    // four promotion branches (RF-58, RF-69 to RF-71, RF-80, RF-83).
    expect(topTriggers).toEqual(['push', 'workflow_dispatch']);
    expect(branchesOf(jobs.get(CHECKS_JOB) ?? '')).toEqual([]);
    expect(branchesOf(jobs.get(UNIT_JOB) ?? '')).toEqual([]);
    for (const job of Object.keys(PUSH_GATES)) expect(branchesOf(jobs.get(job) ?? ''), job).toHaveLength(1);
    expect(new Set(gateBranches)).toEqual(new Set(PROMOTION_BRANCHES));
  });

  it('TC-000-101 promotion runs last, only on success, and never from manual runs or production', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);
    const promoteJob = jobs.get('promote') ?? '';

    // Act
    const needs = needsOf(promoteJob);

    // Assert: it waits for every other job and starts only if none failed or was canceled (RF-72,
    // RF-73) ...
    expect(new Set(needs)).toEqual(new Set([...jobs.keys()].filter((name) => name !== 'promote')));
    expect(promoteJob).toContain('!cancelled() && !failure()');
    expect(promoteJob).toContain('npm run ci:promote');
    // ... only for pushes to eyter_dev, release and main; never manual runs or production (RF-71, RF-73).
    expect(promoteJob).toContain("github.event_name == 'push'");
    expect(branchesOf(promoteJob)).toEqual(['eyter_dev', 'release', 'main']);
    // One promotion at a time; no ignored failure; nothing force-pushes or deletes a branch (RF-76).
    expect(promoteJob).toMatch(/concurrency:\s*\n\s+group: promotion/);
    expect(content).not.toContain('continue-on-error');
    expect(content).not.toMatch(/push\s+(-f|--force|--delete)|branch\s+-[dD]\b/);
    // The manual and production jobs never reach promote (RF-73).
    for (const name of Object.keys(MANUAL_JOBS)) expect(jobs.get(name), name).not.toContain('ci:promote');
    for (const name of gatesOf('production')) expect(jobs.get(name), name).not.toContain('ci:promote');
  });
});

describe('GitHub workflow — security', () => {
  it('TC-000-114 GitHub workflow scans secrets after every Playwright job and uploads only after a clean scan', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    for (const job of PLAYWRIGHT_JOBS) {
      // Act
      const text = jobs.get(job) ?? '';
      const testLine = Math.max(lineIndex(text, 'npx playwright test'), lineIndex(text, 'npm run ci:run-suite'));
      const scanLine = lineIndex(text, 'run: npm run check:secrets');
      const uploadLine = lineIndex(text, 'uses: actions/upload-artifact@');

      // Assert: the scan runs after the tests even when they fail, and the upload comes after it and
      // depends on its success (RF-79).
      expect(testLine, job).toBeGreaterThanOrEqual(0);
      expect(scanLine, job).toBeGreaterThan(testLine);
      expect(lines(text)[scanLine - 1], job).toBe('if: always()');
      expect(uploadLine, job).toBeGreaterThan(scanLine);
      expect(lines(text)[uploadLine - 1], job).toBe("- if: always() && steps.secrets.outcome == 'success'");
      expect(text, job).toContain('id: secrets');
    }
  });

  it('TC-000-116 GitHub workflow is read-only, never ignores a failure, prints no environment and never pushes', () => {
    // Arrange
    const content = workflow();

    // Act
    const envPrinting = findEnvPrinting(content, '.github/workflows/ci.yml');
    const secretUses = [...content.matchAll(/^\s+([A-Z_0-9]+): \$\{\{ secrets\.([A-Z_0-9]+) \}\}$/gm)];

    // Assert: read-only default token (the promotion uses its own PROMOTION_TOKEN), no ignored
    // failures, no environment printing (RF-65), no git writes, and every credential comes from a
    // secret of the same name (RF-64, RF-77, RF-81).
    expect(content).toMatch(/^permissions:\s*\n\s+contents: read\s*$/m);
    expect(content).not.toContain('continue-on-error');
    expect(envPrinting).toEqual([]);
    expect(content).not.toMatch(/git\s+(push|merge)\b/);
    for (const [, variable, secret] of secretUses) expect(variable).toBe(secret);
    expect(new Set(secretUses.map((match) => match[1]))).toEqual(new Set(SECRET_NAMES));
    for (const name of SECRET_NAMES) expect(content, name).not.toMatch(new RegExp(`^\\s+${name}: (?!\\$\\{\\{ secrets\\.)`, 'm'));
  });

  it('TC-000-130 only the publish job can write to Pages, after the scan, from push runs', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);
    const publish = jobs.get(PUBLISH_JOB) ?? '';

    // Act
    const testJobs = [CHECKS_JOB, UNIT_JOB, ...Object.keys(PUSH_GATES)];
    const step = (text: string) => lineIndex(publish, text);

    // Assert: it runs after every test job of a push run, whatever their result, never for a
    // manual run; it reads the job results from `needs` (RF-88) ...
    expect(conditionOf(publish)).toBe("${{ always() && github.event_name == 'push' }}");
    expect(new Set(needsOf(publish))).toEqual(new Set(testJobs));
    expect(publish).toContain('NEEDS_JSON: ${{ toJSON(needs) }}');
    // ... it is the only job allowed to write to Pages, one publication at a time ...
    for (const permission of PAGES_PERMISSIONS) {
      expect(publish, permission).toContain(permission);
      for (const [name, text] of jobs) if (name !== PUBLISH_JOB) expect(text, `${name}: ${permission}`).not.toContain(permission);
    }
    const topLevelPermissions = /^permissions:\s*\n((?: {2}\S.*\n)*)/m.exec(content)?.[1]?.trim().split(/\s*\n\s*/) ?? [];
    expect(topLevelPermissions).toEqual(['contents: read']);
    expect(publish).toMatch(/environment:\s*\n\s+name: github-pages/);
    expect(publish).toMatch(/concurrency:\s*\n\s+group: pages/);
    // ... and the page is built, scanned for secrets, then uploaded and deployed, in that order.
    expect(step('uses: actions/download-artifact@')).toBeGreaterThan(step('run: npm ci'));
    expect(publish).toContain('pattern: summary-*');
    expect(step('run: npm run report:pages')).toBeGreaterThan(step('uses: actions/download-artifact@'));
    expect(step('run: npm run check:secrets')).toBeGreaterThan(step('run: npm run report:pages'));
    expect(step('uses: actions/upload-pages-artifact@')).toBeGreaterThan(step('run: npm run check:secrets'));
    expect(step('uses: actions/deploy-pages@')).toBeGreaterThan(step('uses: actions/upload-pages-artifact@'));
    // The manual run never publishes; the promotion waits for the publication (RF-73).
    for (const name of Object.keys(MANUAL_JOBS)) expect(jobs.get(name), name).not.toMatch(/report:pages|deploy-pages/);
    expect(needsOf(jobs.get('promote') ?? '')).toContain(PUBLISH_JOB);
  });

  it('TC-000-146 a regression started directly on a later branch is refused', () => {
    // Arrange
    const checks = jobsOf(workflow()).get(CHECKS_JOB) ?? '';

    // Act
    const steps = lines(checks.slice(checks.indexOf('    steps:'))).filter((line) => !line.startsWith('#'));

    // Assert: the first step, before checkout, stops a direct regression on release, main or
    // production with the RF-92 message; its condition leaves push runs, smoke runs, eyter_dev and
    // chained runs alone. Every later job needs checks, so nothing else runs.
    expect(steps[1]).toBe(`- ${REGRESSION_GUARD_IF}`);
    expect(steps[2]).toBe(`run: 'echo "::error::${REGRESSION_GUARD_MESSAGE}" && exit 1'`);
    expect(steps[3]).toMatch(/^- uses: actions\/checkout@/);
  });

  it('TC-000-144 only the chain job can dispatch runs and it never merges', () => {
    // Arrange
    const jobs = jobsOf(workflow());
    const chainJob = jobs.get(CHAIN_JOB) ?? '';

    // Act
    const permissions = /^ {4}permissions:\s*\n((?: {6}\S.*\n)*)/m.exec(chainJob)?.[1]?.trim().split(/\s*\n\s*/) ?? [];

    // Assert: it runs only after a green manual regression on eyter_dev, release or main (RF-91),
    // waits for every manual job, may only start workflow runs, and never merges or promotes.
    expect(conditionOf(chainJob)).toBe("${{ !cancelled() && !failure() && github.event_name == 'workflow_dispatch' && inputs.suite == 'regression' && github.ref_name != 'production' }}");
    expect(new Set(needsOf(chainJob))).toEqual(new Set([CHECKS_JOB, UNIT_JOB, ...Object.keys(MANUAL_JOBS)]));
    expect(permissions).toEqual(['actions: write', 'contents: read']);
    for (const [name, text] of jobs) if (name !== CHAIN_JOB) expect(text, name).not.toContain('actions: write');
    expect(chainJob).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    for (const input of ['suite', 'browser', 'layer']) expect(chainJob, input).toContain(`${input.toUpperCase()}: \${{ inputs.${input} }}`);
    expect(chainJob).toContain('run: npm run ci:chain');
    expect(chainJob).not.toMatch(/ci:promote|report:pages|deploy-pages/);
  });

  it('TC-000-162 workflow values with a colon are quoted so GitHub can load the file', () => {
    // Arrange: every single-line `key: value` (also list items `- key: value`) outside comments.
    const content = workflow();

    // Act: plain (unquoted) values that YAML would read as a nested mapping or cut at a comment.
    const offending = content
      .split(/\r?\n/)
      .map((line, index) => ({ line: index + 1, text: line }))
      .filter(({ text }) => !text.trim().startsWith('#'))
      .map(({ line, text }) => ({ line, value: /^\s*(?:- )?[\w.-]+: (.+)$/.exec(text)?.[1] ?? '' }))
      .filter(({ value }) => value !== '' && !/^['"|>[{]/.test(value) && !value.startsWith('${{'))
      .filter(({ value }) => value.includes(': ') || value.includes(' #'));

    // Assert: none; an unquoted ": " makes GitHub reject the whole file (run 38030869300).
    expect(offending).toEqual([]);
  });

  it('TC-000-95 CI script check flags environment printing', () => {
    // Arrange: a CI definition with `printenv`, `env | sort` and `set -x`, plus harmless `env:` keys
    // and expressions that must not be flagged.
    const content = readFileSync(PRINT_ENV_FIXTURE, 'utf8');
    const expectedLines = ['printenv', 'env | sort', 'set -x'].map((command) => content.split(/\r?\n/).findIndex((line) => line.trim() === `- run: ${command}`) + 1);

    // Act
    const findings = findEnvPrinting(content, 'ci.yml');

    // Assert: exactly three findings, each naming its command and line.
    expect(findings).toEqual([
      { file: 'ci.yml', line: expectedLines[0], command: 'printenv' },
      { file: 'ci.yml', line: expectedLines[1], command: 'env' },
      { file: 'ci.yml', line: expectedLines[2], command: 'set -x' },
    ]);
  });
});
