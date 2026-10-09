import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findEnvPrinting } from '../../../scripts/check-ci-scripts';
import { lockedPlaywrightVersion, playwrightImages } from '../../../scripts/lib/playwright-version';
import { REPO_ROOT, fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-58 to RF-82: the GitHub Actions workflow runs the checks and
// each branch's Playwright gate, scans secrets before publishing artifacts, offers the manual
// SUITE/BROWSER run, and promotes a green commit to the next branch. The workflow is read as text
// (no YAML dependency is approved) and split into its jobs. RF-65: CI must never print the environment.
const WORKFLOW_FILE = join(REPO_ROOT, '.github', 'workflows', 'ci.yml');
const PRINT_ENV_FIXTURE = fixturePath('ci', 'print-env', 'ci.yml');
const PROMOTION_BRANCHES = ['eyter_dev', 'release', 'main', 'production'];
const CHECK_TASKS = ['spec:check', 'lint', 'typecheck', 'test:unit'];
const SECRET_NAMES = ['BASE_URL', 'API_BASE_URL', 'TEST_USER_EMAIL', 'TEST_USER_PASSWORD', 'TEST_USER_2_EMAIL', 'TEST_USER_2_PASSWORD', 'PROMOTION_TOKEN'];
/** Each push gate: its branch and its test command (RF-58, RF-69 to RF-71). */
const PUSH_GATES = {
  'smoke-api': { branch: 'eyter_dev', command: 'npx playwright test --grep @smoke --project=api' },
  'smoke-ui-chromium': { branch: 'eyter_dev', command: 'npx playwright test --grep @smoke --project=chromium' },
  'release-regression': { branch: 'release', command: 'npm run ci:run-suite', suite: 'regression', browser: 'all' },
  'main-smoke': { branch: 'main', command: 'npm run ci:run-suite', suite: 'smoke', browser: 'all' },
  'production-smoke': { branch: 'production', command: 'npm run ci:run-suite', suite: 'smoke', browser: 'chromium' },
} as const;
const PLAYWRIGHT_JOBS = [...Object.keys(PUSH_GATES), 'run-suite'];
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

/** RF-58, RF-69 to RF-71: the gate job of `name` runs its command on its branch, after the checks. */
function expectGate(jobs: Map<string, string>, name: keyof typeof PUSH_GATES): void {
  const gate = PUSH_GATES[name];
  const text = jobs.get(name) ?? '';
  expect(branchesOf(text), name).toEqual([gate.branch]);
  expect(text, name).toContain("github.event_name == 'push'");
  expect(text, name).toContain(gate.command);
  expect(text, name).toContain('needs: checks');
  if ('suite' in gate) {
    expect(text, name).toContain(`SUITE: ${gate.suite}`);
    expect(text, name).toContain(`BROWSER: ${gate.browser}`);
  }
}

describe('GitHub workflow — positive', () => {
  it('TC-000-86 CI definition declares the gates, reports and artifacts', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const checks = jobs.get('checks') ?? '';

    // Assert: a push on the four promotion branches triggers the workflow; the checks job runs the
    // four checks; the eyter_dev gate runs the smoke suite on api and chromium (RF-58); every job checks
    // the code out and marks the workspace safe for git (TC-000-30 runs git in the container).
    expect(content).toMatch(/push:\s*\n\s+branches: \[eyter_dev, release, main, production\]/);
    for (const task of CHECK_TASKS) expect(checks, task).toContain(task);
    expect(checks).toContain('npm run ${{ matrix.task }}');
    expectGate(jobs, 'smoke-api');
    expectGate(jobs, 'smoke-ui-chromium');
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
    const name = 'release-regression';

    // Assert: regression on api and every browser, through the RF-60 to RF-63 runner (RF-69).
    expectGate(jobs, name);
  });

  it('TC-000-99 CI definition runs the main gate', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    // Act
    const name = 'main-smoke';

    // Assert: smoke on api and every browser (RF-70).
    expectGate(jobs, name);
  });

  it('TC-000-100 CI definition runs the production sanity gate', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    // Act
    const name = 'production-smoke';

    // Assert: smoke on api and chromium (RF-71).
    expectGate(jobs, name);
  });

  it('TC-000-115 GitHub manual run selects the suite through ci:run-suite', () => {
    // Arrange
    const content = workflow();

    // Act
    const runSuite = jobsOf(content).get('run-suite') ?? '';

    // Assert: the manual run offers the RF-60/RF-61 choices and passes them to the shared runner (RF-80).
    expect(content).toMatch(/workflow_dispatch:\s*\n\s+inputs:/);
    expect(content).toContain('options: [smoke, regression]');
    expect(content).toContain('options: [chromium, firefox, webkit, all]');
    expect(runSuite).toContain("if: github.event_name == 'workflow_dispatch'");
    expect(runSuite).toContain('SUITE: ${{ inputs.suite }}');
    expect(runSuite).toContain('BROWSER: ${{ inputs.browser }}');
    expect(runSuite).toContain('npm run ci:run-suite');
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

    // Assert: only push and workflow_dispatch trigger the workflow; each gate names exactly its one
    // branch, and together they cover the four promotion branches (RF-58, RF-69 to RF-71, RF-80).
    expect(topTriggers).toEqual(['push', 'workflow_dispatch']);
    for (const job of Object.keys(PUSH_GATES)) expect(branchesOf(jobs.get(job) ?? ''), job).toHaveLength(1);
    expect(new Set(gateBranches)).toEqual(new Set(PROMOTION_BRANCHES));
  });

  it('TC-000-101 promotion runs last, only on success, and never from manual runs or production', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);
    const promoteJob = jobs.get('promote') ?? '';

    // Act
    const needs = /needs: \[([^\]]*)\]/.exec(promoteJob)?.[1]?.split(',').map((name) => name.trim()) ?? [];

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
    // The run-suite and production jobs never reach promote (RF-73).
    expect(jobs.get('run-suite')).not.toContain('ci:promote');
    expect(jobs.get('production-smoke')).not.toContain('ci:promote');
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
