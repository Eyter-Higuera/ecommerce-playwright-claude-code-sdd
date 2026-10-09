import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findEnvPrinting } from '../../../scripts/check-ci-scripts';
import { lockedPlaywrightVersion, playwrightImages } from '../../../scripts/lib/playwright-version';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-78 to RF-82: the GitHub mirror runs the same branch gates as
// GitLab in GitHub Actions, scans secrets before publishing artifacts, offers the manual
// SUITE/BROWSER run, is read-only and never promotes. The workflow is read as text (no YAML
// dependency is approved) and split into its jobs.
const WORKFLOW_FILE = join(REPO_ROOT, '.github', 'workflows', 'ci.yml');
const PROMOTION_BRANCHES = ['eyter_dev', 'release', 'main', 'production'];
const CHECK_TASKS = ['spec:check', 'lint', 'typecheck', 'test:unit'];
const SECRET_NAMES = ['BASE_URL', 'API_BASE_URL', 'TEST_USER_EMAIL', 'TEST_USER_PASSWORD', 'TEST_USER_2_EMAIL', 'TEST_USER_2_PASSWORD'];
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

const workflow = (): string => readFileSync(WORKFLOW_FILE, 'utf8');

/** The jobs of the workflow: name → its text (key line included). */
function jobsOf(content: string): Map<string, string> {
  const jobs = new Map<string, string>();
  const lines = content.split(/\r?\n/);
  let inJobs = false;
  let current: string | undefined;
  for (const line of lines) {
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

/** The `- ...` step lines of a job, trimmed, in order (a step starts with "- "). */
function stepLines(job: string): string[] {
  return job
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Index of the first line of `job` that contains `text` (-1 when absent). */
function lineIndex(job: string, text: string): number {
  return stepLines(job).findIndex((line) => line.includes(text));
}

describe('GitHub workflow — positive', () => {
  it('TC-000-111 GitHub workflow runs the checks and the eyter_dev gate', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const checks = jobs.get('checks') ?? '';

    // Assert: a push on the four promotion branches triggers the workflow, the checks job runs the
    // four checks, and the two eyter_dev jobs run the smoke suite on api and chromium after it (RF-78).
    expect(content).toMatch(/push:\s*\n\s+branches: \[eyter_dev, release, main, production\]/);
    for (const task of CHECK_TASKS) expect(checks, task).toContain(task);
    expect(checks).toContain('npm run ${{ matrix.task }}');
    for (const job of ['smoke-api', 'smoke-ui-chromium'] as const) {
      const text = jobs.get(job) ?? '';
      expect(text, job).toContain(`github.ref_name == '${PUSH_GATES[job].branch}'`);
      expect(text, job).toContain(PUSH_GATES[job].command);
      expect(text, job).toContain('needs: checks');
    }
  });

  it('TC-000-112 GitHub workflow runs the release, main and production gates', () => {
    // Arrange
    const jobs = jobsOf(workflow());

    // Act
    const gates = (['release-regression', 'main-smoke', 'production-smoke'] as const).map((name) => ({ name, gate: PUSH_GATES[name], text: jobs.get(name) ?? '' }));

    // Assert: each gate selects its suite and browsers through the RF-60 to RF-63 runner, on its own
    // branch, after the checks (RF-78).
    for (const { name, gate, text } of gates) {
      expect(text, name).toContain(`github.ref_name == '${gate.branch}'`);
      expect(text, name).toContain(`SUITE: ${gate.suite}`);
      expect(text, name).toContain(`BROWSER: ${gate.browser}`);
      expect(text, name).toContain(gate.command);
      expect(text, name).toContain('needs: checks');
    }
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

  it('TC-000-117 GitHub container image version equals installed @playwright/test version', () => {
    // Arrange
    const locked = lockedPlaywrightVersion(readFileSync(join(REPO_ROOT, 'package-lock.json'), 'utf8'));

    // Act
    const versions = playwrightImages(workflow()).map((image) => image.version);

    // Assert: every job image matches the locked library version (RF-82, RF-2).
    expect(locked).toBeDefined();
    expect(versions.length).toBeGreaterThan(0);
    expect(new Set(versions)).toEqual(new Set([locked]));
  });
});

describe('GitHub workflow — negative', () => {
  it('TC-000-113 each GitHub gate runs only on its own branch or event', () => {
    // Arrange
    const content = workflow();
    const jobs = jobsOf(content);

    // Act
    const triggers = /\non:\s*\n((?: {2}\S.*\n|(?: {4,}).*\n)*)/.exec(content)?.[1] ?? '';
    const topTriggers = [...triggers.matchAll(/^ {2}([\w_]+):/gm)].map((match) => match[1]);

    // Assert: only push and workflow_dispatch trigger the workflow; each push gate names exactly one
    // branch and needs a push; the manual job runs only on dispatch; nothing promotes (RF-78, RF-80, RF-81).
    expect(topTriggers).toEqual(['push', 'workflow_dispatch']);
    for (const [job, gate] of Object.entries(PUSH_GATES)) {
      const text = jobs.get(job) ?? '';
      const branches = [...text.matchAll(/github\.ref_name == '([^']+)'/g)].map((match) => match[1]);
      expect(branches, job).toEqual([gate.branch]);
      expect(text, job).toContain("github.event_name == 'push'");
    }
    expect(PROMOTION_BRANCHES.every((branch) => Object.values(PUSH_GATES).some((gate) => gate.branch === branch))).toBe(true);
    expect([...jobs.keys()].some((job) => job.includes('promote'))).toBe(false);
    expect(content).not.toContain('ci:promote');
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
      // depends on its success; the artifacts are kept 7 days (RF-79).
      expect(testLine, job).toBeGreaterThanOrEqual(0);
      expect(scanLine, job).toBeGreaterThan(testLine);
      expect(stepLines(text)[scanLine - 1], job).toBe('if: always()');
      expect(uploadLine, job).toBeGreaterThan(scanLine);
      expect(stepLines(text)[uploadLine - 1], job).toBe("- if: always() && steps.secrets.outcome == 'success'");
      expect(text, job).toContain('id: secrets');
      expect(text, job).toContain('retention-days: 7');
      for (const path of ['playwright-report/', 'reports/', 'test-results/']) expect(text, `${job} ${path}`).toContain(path);
    }
  });

  it('TC-000-116 GitHub workflow is read-only, never ignores a failure, prints no environment and never pushes', () => {
    // Arrange
    const content = workflow();

    // Act
    const envPrinting = findEnvPrinting(content, '.github/workflows/ci.yml');
    const secretUses = [...content.matchAll(/^\s+([A-Z_0-9]+): \$\{\{ secrets\.([A-Z_0-9]+) \}\}$/gm)];

    // Assert: read-only token, no ignored failures, no environment printing (RF-65), no git writes,
    // and the six variables come only from secrets with matching names (RF-81).
    expect(content).toMatch(/^permissions:\s*\n\s+contents: read\s*$/m);
    expect(content).not.toContain('continue-on-error');
    expect(envPrinting).toEqual([]);
    expect(content).not.toMatch(/git\s+(push|merge)|push\s+(-f|--force|--delete)|branch\s+-[dD]\b/);
    expect(secretUses.length).toBeGreaterThan(0);
    for (const [, variable, secret] of secretUses) expect(variable).toBe(secret);
    expect(new Set(secretUses.map((match) => match[1]))).toEqual(new Set(SECRET_NAMES));
    for (const name of SECRET_NAMES) expect(content, name).not.toMatch(new RegExp(`^\\s+${name}: (?!\\$\\{\\{ secrets\\.)`, 'm'));
  });
});
