import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findEnvPrinting } from '../../../scripts/check-ci-scripts';
import { lockedPlaywrightVersion, playwrightImages } from '../../../scripts/lib/playwright-version';
import { REPO_ROOT, fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-58 to RF-67 and RF-69 to RF-77: the push pipelines of
// eyter_dev, release, main and production, and the promotion job that merges a green commit into
// the next branch. The definition is read as text (no YAML dependency is approved) and split into
// its top-level blocks (jobs and templates). RF-65: CI scripts must never print the environment.
const PRINT_ENV_FIXTURE = fixturePath('ci', 'print-env', '.gitlab-ci.yml');
const CI_FILE = join(REPO_ROOT, '.gitlab-ci.yml');
const PROMOTION_BRANCHES = ['eyter_dev', 'release', 'main', 'production'];
const pushRule = (branch: string): string => `- if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "${branch}"`;
const CHECK_JOBS = {
  'spec-check': 'npm run spec:check',
  lint: 'npm run lint',
  typecheck: 'npm run typecheck',
  unit: 'npm run test:unit',
};
const EYTER_DEV_PLAYWRIGHT_JOBS = {
  'smoke-api': 'npx playwright test --grep @smoke --project=api',
  'smoke-ui-chromium': 'npx playwright test --grep @smoke --project=chromium',
};
/** Gate template, Playwright job and its SUITE/BROWSER for each later branch (RF-69 to RF-71). */
const BRANCH_GATES = {
  release: { template: '.release-gate', job: 'release-regression', suite: 'regression', browser: 'all' },
  main: { template: '.main-gate', job: 'main-smoke', suite: 'smoke', browser: 'all' },
  production: { template: '.production-gate', job: 'production-smoke', suite: 'smoke', browser: 'chromium' },
} as const;
const PLAYWRIGHT_JOBS = [...Object.keys(EYTER_DEV_PLAYWRIGHT_JOBS), ...Object.values(BRANCH_GATES).map((gate) => gate.job)];
const TOP_LEVEL_KEY = /^([.\w-]+):/;

/** Top-level blocks of a GitLab CI file: key → its text (key line included). */
function topLevelBlocks(content: string): Map<string, string> {
  const blocks = new Map<string, string>();
  let current: string | undefined;
  for (const line of content.split(/\r?\n/)) {
    const key = TOP_LEVEL_KEY.exec(line)?.[1];
    if (key !== undefined) current = key;
    if (current !== undefined) blocks.set(current, `${blocks.get(current) ?? ''}${line}\n`);
  }
  return blocks;
}

/** Items of the top-level `stages:` list, in order. */
function stagesOf(blocks: Map<string, string>): string[] {
  return [...(blocks.get('stages') ?? '').matchAll(/^\s+- (\S+)/gm)].map((match) => match[1] ?? '');
}

/** check:secrets jobs that need `job`'s artifacts. */
function scanJobsFor(blocks: Map<string, string>, job: string): string[] {
  return [...blocks.entries()].filter(([, block]) => block.includes('.check-secrets') && block.includes(`- job: ${job}\n`)).map(([name]) => name);
}

const ciContent = (): string => readFileSync(CI_FILE, 'utf8');

/** RF-69 to RF-71: the check jobs, one SUITE/BROWSER Playwright job and its scan run on `branch`. */
function expectBranchGate(blocks: Map<string, string>, branch: keyof typeof BRANCH_GATES): void {
  const gate = BRANCH_GATES[branch];
  const playwrightJob = blocks.get(gate.job) ?? '';

  // The check jobs run on every promotion branch, this one included.
  expect(blocks.get('.checks')).toContain(pushRule(branch));
  for (const [job, command] of Object.entries(CHECK_JOBS)) {
    expect(blocks.get(job), job).toContain('.checks');
    expect(blocks.get(job), job).toContain(command);
  }
  // The gate template targets this branch only.
  expect(blocks.get(gate.template)).toContain(pushRule(branch));
  expect([...(blocks.get(gate.template) ?? '').matchAll(/\$CI_COMMIT_BRANCH == "([^"]+)"/g)].map((match) => match[1])).toEqual([branch]);
  // One Playwright job selects the suite and browsers through the RF-60 to RF-63 runner.
  expect(playwrightJob).toContain(gate.template);
  expect(playwrightJob).toContain('.playwright-reports');
  expect(playwrightJob).toContain(`SUITE: "${gate.suite}"`);
  expect(playwrightJob).toContain(`BROWSER: "${gate.browser}"`);
  expect(playwrightJob).toContain('npm run ci:run-suite');
  // check:secrets scans that job's artifacts.
  expect(scanJobsFor(blocks, gate.job)).toHaveLength(1);
}

describe('GitLab pipeline — positive', () => {
  it('TC-000-86 CI definition declares the gates, reports and artifacts', () => {
    // Arrange
    const content = ciContent();
    const blocks = topLevelBlocks(content);
    const reportsTemplate = blocks.get('.playwright-reports') ?? '';

    // Act
    const stages = stagesOf(blocks);

    // Assert: every eyter_dev gate job exists with its command (RF-58).
    for (const [job, command] of Object.entries({ ...CHECK_JOBS, ...EYTER_DEV_PLAYWRIGHT_JOBS })) {
      expect(blocks.get(job), job).toContain(command);
    }
    for (const job of Object.keys(EYTER_DEV_PLAYWRIGHT_JOBS)) expect(blocks.get(job), job).toContain('.eyter-dev-gate');
    // check:secrets runs in a later stage, after (needs) each Playwright job (RF-58).
    expect(stages.indexOf('scan')).toBeGreaterThan(stages.indexOf('test'));
    expect(blocks.get('.check-secrets')).toContain('npm run check:secrets');
    for (const job of PLAYWRIGHT_JOBS) expect(scanJobsFor(blocks, job), job).toHaveLength(1);
    // JUnit published, evidence kept 7 days also on failure, flaky count printed (RF-51, RF-66, RF-67).
    for (const expected of ['junit: reports/junit.xml', 'when: always', 'expire_in: 7 days', '- playwright-report/', '- reports/', '- test-results/', 'npm run report:flaky']) {
      expect(reportsTemplate, expected).toContain(expected);
    }
    expect(PLAYWRIGHT_JOBS.every((job) => blocks.get(job)?.includes('.playwright-reports'))).toBe(true);
    // RF-65: nothing prints the environment.
    expect(findEnvPrinting(content, '.gitlab-ci.yml')).toEqual([]);
  });

  it('TC-000-04 CI Playwright image version equals installed @playwright/test version', () => {
    // Arrange
    const locked = lockedPlaywrightVersion(readFileSync(join(REPO_ROOT, 'package-lock.json'), 'utf8'));

    // Act
    const versions = playwrightImages(ciContent()).map((image) => image.version);

    // Assert: at least one image, and every image matches the locked library version (RF-2).
    expect(locked).toBeDefined();
    expect(versions.length).toBeGreaterThan(0);
    expect(new Set(versions)).toEqual(new Set([locked]));
  });

  it('TC-000-98 CI definition runs the release gate', () => {
    // Arrange
    const content = ciContent();

    // Act
    const blocks = topLevelBlocks(content);

    // Assert: check jobs plus full regression on api, chromium, firefox and webkit (test-plan §6).
    expectBranchGate(blocks, 'release');
  });

  it('TC-000-99 CI definition runs the main gate', () => {
    // Arrange
    const content = ciContent();

    // Act
    const blocks = topLevelBlocks(content);

    // Assert: check jobs plus smoke on api and the three browsers (test-plan §6).
    expectBranchGate(blocks, 'main');
  });

  it('TC-000-100 CI definition runs the production sanity gate', () => {
    // Arrange
    const content = ciContent();

    // Act
    const blocks = topLevelBlocks(content);

    // Assert: check jobs plus smoke on api and chromium after the last promotion.
    expectBranchGate(blocks, 'production');
  });
});

describe('GitLab pipeline — negative', () => {
  it('TC-000-87 each push gate runs only on its own branch', () => {
    // Arrange
    const content = ciContent();
    const blocks = topLevelBlocks(content);

    // Act: every branch name any rule compares against.
    const branches = [...content.matchAll(/\$CI_COMMIT_BRANCH == "([^"]+)"/g)].map((match) => match[1]);

    // Assert: only the four promotion branches appear, and the eyter_dev smoke jobs keep their
    // eyter_dev-only rule (RF-58).
    expect(new Set(branches)).toEqual(new Set(PROMOTION_BRANCHES));
    expect(blocks.get('.eyter-dev-gate')).toContain(pushRule('eyter_dev'));
    expect([...(blocks.get('.eyter-dev-gate') ?? '').matchAll(/\$CI_COMMIT_BRANCH == "([^"]+)"/g)].map((match) => match[1])).toEqual(['eyter_dev']);
    for (const job of Object.keys(EYTER_DEV_PLAYWRIGHT_JOBS)) {
      expect(blocks.get(job), job).toContain('.eyter-dev-gate');
    }
  });

  it('TC-000-101 promotion runs last, only on success, and never from web runs or production', () => {
    // Arrange
    const content = ciContent();
    const blocks = topLevelBlocks(content);
    const promoteJob = blocks.get('promote') ?? '';

    // Act
    const stages = stagesOf(blocks);
    const promoteBranches = [...promoteJob.matchAll(/\$CI_COMMIT_BRANCH == "([^"]+)"/g)].map((match) => match[1]);

    // Assert: the last stage, so it starts only after every other job succeeded (RF-72, RF-73) ...
    expect(stages.at(-1)).toBe('promote');
    expect(promoteJob).toContain('stage: promote');
    expect(promoteJob).toContain('npm run ci:promote');
    // ... only for pushes to eyter_dev, release and main, each rule with when: on_success; never
    // for web runs or production (RF-71, RF-73).
    expect(promoteBranches).toEqual(['eyter_dev', 'release', 'main']);
    for (const branch of promoteBranches) expect(promoteJob).toContain(`${pushRule(branch ?? '')}\n      when: on_success`);
    expect(promoteJob).not.toContain('"web"');
    // No job may fail without stopping the chain, and promotions run one at a time.
    expect(content).not.toContain('allow_failure');
    expect(promoteJob).toContain('resource_group:');
    // RF-76: nothing force-pushes or deletes a branch.
    expect(content).not.toMatch(/push\s+(-f|--force|--delete)|branch\s+-[dD]\b/);
  });
});

describe('CI scripts — security', () => {
  it('TC-000-95 CI script check flags environment printing', () => {
    // Arrange: a CI definition with `printenv`, `env | sort` and `set -x`, plus harmless uses of
    // the word "environment" that must not be flagged.
    const content = readFileSync(PRINT_ENV_FIXTURE, 'utf8');
    const expectedLines = ['printenv', 'env | sort', 'set -x'].map(
      (command) => content.split(/\r?\n/).findIndex((line) => line.trim() === `- ${command}`) + 1,
    );

    // Act
    const findings = findEnvPrinting(content, '.gitlab-ci.yml');

    // Assert: exactly three findings, each naming its command and line.
    expect(findings).toEqual([
      { file: '.gitlab-ci.yml', line: expectedLines[0], command: 'printenv' },
      { file: '.gitlab-ci.yml', line: expectedLines[1], command: 'env' },
      { file: '.gitlab-ci.yml', line: expectedLines[2], command: 'set -x' },
    ]);
  });
});
