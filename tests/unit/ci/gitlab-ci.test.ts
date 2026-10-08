import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findEnvPrinting } from '../../../scripts/check-ci-scripts';
import { lockedPlaywrightVersion, playwrightImages } from '../../../scripts/lib/playwright-version';
import { REPO_ROOT, fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-58 to RF-67: the eyter_dev pipeline. The definition is read
// as text (no YAML dependency is approved) and split into its top-level blocks (jobs and
// templates). RF-65: CI scripts must never print the environment.
const PRINT_ENV_FIXTURE = fixturePath('ci', 'print-env', '.gitlab-ci.yml');
const CI_FILE = join(REPO_ROOT, '.gitlab-ci.yml');
const PUSH_GATE_RULE = '- if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "eyter_dev"';
const GATE_JOBS = {
  'spec-check': 'npm run spec:check',
  lint: 'npm run lint',
  typecheck: 'npm run typecheck',
  unit: 'npm run test:unit',
  'smoke-api': 'npx playwright test --grep @smoke --project=api',
  'smoke-ui-chromium': 'npx playwright test --grep @smoke --project=chromium',
};
const PLAYWRIGHT_JOBS = ['smoke-api', 'smoke-ui-chromium'];
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

const ciContent = (): string => readFileSync(CI_FILE, 'utf8');

describe('GitLab pipeline — positive', () => {
  it('TC-000-86 CI definition declares the gates, reports and artifacts', () => {
    // Arrange
    const content = ciContent();
    const blocks = topLevelBlocks(content);
    const reportsTemplate = blocks.get('.playwright-reports') ?? '';

    // Act: the check:secrets job that follows each Playwright job.
    const scanJobs = [...blocks.entries()].filter(([, block]) => block.includes('extends: [.push-gate, .check-secrets]'));

    // Assert: every gate job exists with its command (RF-58).
    for (const [job, command] of Object.entries(GATE_JOBS)) {
      expect(blocks.get(job), job).toContain(command);
    }
    // check:secrets runs in the last stage, after (needs) each Playwright job (RF-58).
    expect(content.indexOf('- scan')).toBeGreaterThan(content.indexOf('- smoke'));
    expect(blocks.get('.check-secrets')).toContain('npm run check:secrets');
    expect(PLAYWRIGHT_JOBS.every((job) => scanJobs.some(([, block]) => block.includes(`- job: ${job}`)))).toBe(true);
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
});

describe('GitLab pipeline — negative', () => {
  it('TC-000-87 push gates are limited to eyter_dev', () => {
    // Arrange
    const content = ciContent();
    const blocks = topLevelBlocks(content);

    // Act: every branch name any rule compares against.
    const branches = [...content.matchAll(/\$CI_COMMIT_BRANCH == "([^"]+)"/g)].map((match) => match[1]);

    // Assert: the push gate rule targets eyter_dev only, and every gate job uses it.
    expect(blocks.get('.push-gate')).toContain(PUSH_GATE_RULE);
    expect(new Set(branches)).toEqual(new Set(['eyter_dev']));
    for (const job of Object.keys(GATE_JOBS)) {
      expect(blocks.get(job), job).toContain('.push-gate');
    }
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
