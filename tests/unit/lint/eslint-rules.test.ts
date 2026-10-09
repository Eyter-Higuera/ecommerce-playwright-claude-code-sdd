import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { CLI_TEST_TIMEOUT_MS, REPO_ROOT, fixturePath } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-27 / RF-28: the repository ESLint config must reject hard
// waits and unawaited Playwright promises, the two most common sources of flaky tests. The
// fixtures under tests/fixtures/lint/ are linted with the real repository config; `ignore: false`
// lifts the global ignore that keeps those intentionally broken files out of `npm run lint`.
const WAIT_FOR_TIMEOUT_RULE = 'playwright/no-wait-for-timeout';
const UNAWAITED_RULES = ['@typescript-eslint/no-floating-promises', 'playwright/missing-playwright-await'];
const ESLINT_ERROR_SEVERITY = 2;

async function lintFixture(fileName: string): Promise<ESLint.LintResult> {
  const eslint = new ESLint({ cwd: REPO_ROOT, ignore: false });
  const [result] = await eslint.lintFiles([fixturePath('lint', fileName)]);
  if (result === undefined) throw new Error(`ESLint returned no result for ${fileName}`);
  return result;
}

function readFixture(fileName: string): string {
  return readFileSync(fixturePath('lint', fileName), 'utf8');
}

/** Lines of the source file that contain a given text, 1-based like ESLint. */
function linesContaining(source: string, text: string): number[] {
  return source
    .split(/\r?\n/)
    .flatMap((line, index) => (line.includes(text) ? [index + 1] : []));
}

function errorLines(result: ESLint.LintResult, ruleIds: string[]): number[] {
  const lines = result.messages
    .filter((message) => message.severity === ESLINT_ERROR_SEVERITY && ruleIds.includes(message.ruleId ?? ''))
    .map((message) => message.line);
  return [...new Set(lines)].sort((a, b) => a - b);
}

describe('ESLint hard waits and awaits — positive', () => {
  it('TC-000-42 lint passes code without waitForTimeout', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: a Playwright test that waits with a web-first assertion.
    const fileName = 'web-first-wait.spec.ts';

    // Act
    const result = await lintFixture(fileName);

    // Assert: compliant code produces no error at all, not only no hard-wait error.
    expect(result.messages).toEqual([]);
    expect(result.errorCount).toBe(0);
  });

  it('TC-000-44 lint passes awaited Playwright calls', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: awaited page.goto, locator.click, request.get and a web-first expect.
    const fileName = 'awaited-calls.spec.ts';

    // Act
    const result = await lintFixture(fileName);

    // Assert
    expect(result.messages).toEqual([]);
    expect(result.errorCount).toBe(0);
  });
});

describe('ESLint hard waits and awaits — negative', () => {
  it('TC-000-43 lint rejects waitForTimeout', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: a test whose only problem is a hard wait.
    const fileName = 'wait-for-timeout.spec.ts';

    // Act
    const result = await lintFixture(fileName);

    // Assert: exactly one error, reported by the hard-wait rule on the waitForTimeout line.
    expect(result.errorCount).toBe(1);
    expect(errorLines(result, [WAIT_FOR_TIMEOUT_RULE])).toEqual(linesContaining(readFixture(fileName), 'waitForTimeout('));
  });

  it('TC-000-45 lint rejects each kind of unawaited Playwright promise', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: unawaited page.click, locator.fill, request.get and expect(...).toBeVisible(),
    // each on its own line marked with an `UNAWAITED` comment.
    const fileName = 'unawaited-calls.spec.ts';

    // Act
    const result = await lintFixture(fileName);

    // Assert: every marked line has an error (two rules may both flag the expect line), and no
    // error comes from another rule, so the error-bearing lines are exactly the four marked ones.
    // (`page.click` also gets a prefer-locator warning, which is not an error.)
    const expectedLines = linesContaining(readFixture(fileName), '// UNAWAITED');
    const errors = result.messages.filter((message) => message.severity === ESLINT_ERROR_SEVERITY);
    expect(expectedLines).toHaveLength(4);
    expect(errorLines(result, UNAWAITED_RULES)).toEqual(expectedLines);
    expect(errors.every((message) => UNAWAITED_RULES.includes(message.ruleId ?? ''))).toBe(true);
  });
});

// RF-29 / RF-30: one test framework per file, and lint scope (what is checked, what is ignored).
const MIXED_IMPORT_RULE = 'no-restricted-imports';
const LINTED_PATHS = ['src/TEST_module.ts', 'tests/ui/TEST_page.spec.ts', 'scripts/TEST_script.ts', 'playwright.config.ts'];
const IGNORED_PATHS = [
  'node_modules/TEST_pkg/index.ts',
  'playwright-report/TEST_report.ts',
  'test-results/TEST_result.ts',
  'reports/TEST_junit.ts',
  'coverage/TEST_coverage.ts',
  'dist/TEST_build.ts',
];

/** True when `npm run lint` would check the path: not ignored and matched by a config block. */
async function isLinted(eslint: ESLint, relativePath: string): Promise<boolean> {
  const absolutePath = `${REPO_ROOT}/${relativePath}`;
  if (await eslint.isPathIgnored(absolutePath)) return false;
  return (await eslint.calculateConfigForFile(absolutePath)) !== undefined;
}

describe('ESLint imports and scope — positive', () => {
  it('TC-000-46 lint accepts files with a single test framework import', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: a Playwright test importing only @playwright/test and a unit test importing only vitest.
    const fileNames = ['playwright-only.spec.ts', 'vitest-only.test.ts'];

    // Act
    const results = await Promise.all(fileNames.map((fileName) => lintFixture(fileName)));

    // Assert: neither file breaks any rule.
    expect(results.map((result) => result.messages)).toEqual([[], []]);
  });

  it('TC-000-48 lint covers source, tests, scripts and root config', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: the repository config, with its ignores active as in `npm run lint`.
    const eslint = new ESLint({ cwd: REPO_ROOT });

    // Act
    const linted = await Promise.all(LINTED_PATHS.map((path) => isLinted(eslint, path)));

    // Assert: every source area is linted.
    expect(linted).toEqual(LINTED_PATHS.map(() => true));
  });
});

describe('ESLint imports and scope — negative', () => {
  it('TC-000-47 lint rejects mixed Playwright and Vitest imports', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange: a Playwright spec that also imports vitest.
    const fileName = 'mixed-imports.spec.ts';

    // Act
    const result = await lintFixture(fileName);

    // Assert: exactly one error, on the forbidden import, naming the module.
    const importErrors = result.messages.filter((message) => message.ruleId === MIXED_IMPORT_RULE);
    expect(result.errorCount).toBe(1);
    expect(importErrors).toHaveLength(1);
    expect(importErrors[0]?.line).toBe(linesContaining(readFixture(fileName), "from 'vitest'")[0]);
    expect(importErrors[0]?.message).toContain("'vitest'");
  });

  it('TC-000-49 lint ignores generated folders', { timeout: CLI_TEST_TIMEOUT_MS }, async () => {
    // Arrange
    const eslint = new ESLint({ cwd: REPO_ROOT });

    // Act
    const ignored = await Promise.all(IGNORED_PATHS.map((path) => eslint.isPathIgnored(`${REPO_ROOT}/${path}`)));

    // Assert: dependencies and generated output are never linted.
    expect(ignored).toEqual(IGNORED_PATHS.map(() => true));
  });
});
