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
});
