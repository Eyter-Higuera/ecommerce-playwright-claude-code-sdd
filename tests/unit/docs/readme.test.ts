import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-89: the README shows the CI status of each promotion branch,
// links to the GitHub Pages results page (RF-88), and explains how to run the unit, API and UI
// tests and the smoke and regression suites by hand, locally and through a manual GitHub Actions
// run on each of the four branches.
const README = join(REPO_ROOT, 'README.md');
const REPOSITORY_URL = 'https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd';
const RESULTS_PAGE_URL = 'https://eyter-higuera.github.io/ecommerce-playwright-claude-code-sdd/';
const BRANCHES = ['eyter_dev', 'release', 'main', 'production'];
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const MANUAL_SECTION = '## Running tests manually';
const WORKTREE_FOLDER = String.raw`%LOCALAPPDATA%\ecommerce-playwright-sdd\worktrees\<branch>`;
/** Any control character except tab and line feed (a lost backslash can turn `\r` into one). */
const CONTROL_CHARACTER = /[\u0000-\u0008\u000B-\u001F]/;

/** The README section that starts with `heading`, up to the next `## ` heading. */
function sectionOf(markdown: string, heading: string): string {
  const start = markdown.indexOf(`${heading}\n`);
  if (start < 0) return '';
  const next = markdown.indexOf('\n## ', start + heading.length);
  return markdown.slice(start, next < 0 ? undefined : next);
}

describe('README — positive', () => {
  it('TC-000-132 README shows badges, the results page and the manual-testing guide', () => {
    // Arrange
    const readme = readFileSync(README, 'utf8').replaceAll('\r\n', '\n');

    // Act
    const guide = sectionOf(readme, MANUAL_SECTION);

    // Assert: one live CI badge per promotion branch, linked to that branch's runs, and the link to
    // the results page ...
    for (const branch of BRANCHES) {
      expect(readme, branch).toContain(`${REPOSITORY_URL}/actions/workflows/ci.yml/badge.svg?branch=${branch}`);
      expect(readme, branch).toContain(`${REPOSITORY_URL}/actions/workflows/ci.yml?query=branch%3A${branch}`);
    }
    expect(readme).toContain(RESULTS_PAGE_URL);
    // ... and a guide with the local commands for every layer and suite ...
    expect(guide).not.toBe('');
    for (const command of ['npm run test:unit', 'npm run test:unit:ci', 'npx playwright test --project=api', '--grep @smoke', '--grep @regression']) {
      expect(guide, command).toContain(command);
    }
    for (const browser of BROWSERS) expect(guide, browser).toContain(`npx playwright test --project=${browser}`);
    // ... and the manual GitHub Actions run on each branch.
    for (const branch of BRANCHES) expect(guide, branch).toContain(`gh workflow run ci.yml --ref ${branch} -f suite=`);
  });

  it('TC-000-150 README documents the VS Code tasks, the four manual inputs and the regression chain', () => {
    // Arrange
    const readme = readFileSync(README, 'utf8').replaceAll('\r\n', '\n');
    const tasks = (JSON.parse(readFileSync(join(REPO_ROOT, '.vscode', 'tasks.json'), 'utf8')) as { tasks: { label: string }[] }).tasks;

    // Act
    const guide = sectionOf(readme, MANUAL_SECTION);

    // Assert: every VS Code task is named, with how to start it (RF-93) ...
    expect(guide).toContain('Tasks: Run Task');
    expect(guide).toContain('never start a pipeline');
    expect(guide).toContain('git worktree remove');
    // ... with the worktree folder written as a real Windows path, no backslash lost (RF-98) ...
    expect(guide).toContain(WORKTREE_FOLDER);
    expect(guide).not.toMatch(CONTROL_CHARACTER);
    for (const { label } of tasks) expect(guide, label).toContain(label);
    // ... the manual GitHub run shows the layer choice on each of the four branches (RF-80, RF-90) ...
    for (const branch of BRANCHES) expect(guide, branch).toMatch(new RegExp(`gh workflow run ci\\.yml --ref ${branch} -f suite=\\w+ -f browser=\\w+ -f layer=\\w+`));
    // ... and the regression chain: from eyter_dev on, never merging, refused elsewhere (RF-91, RF-92).
    for (const text of ['starts from `eyter_dev`', 'continues on `release`, `main` and `production`', 'never merges', 'refused']) expect(guide, text).toContain(text);
  });
});
