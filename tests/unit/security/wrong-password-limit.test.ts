import { describe, expect, it } from 'vitest';
import { collectSpecFiles, findWrongPasswordUses, findWrongPasswordViolations } from '../../../scripts/check-wrong-password';
import { REPO_ROOT, fixturePath } from '../helpers/run-cli';

// Spec 001 — Authentication. RF-28: at most one login with a wrong password for test account A per
// Playwright invocation, retries included, and none for account B. Every such login is built with
// `withWrongPassword()`, so a static check over the Playwright test files enforces the limit
// (plan D-5); this unit test runs it in the CI `unit` job.
const WRONG_PASSWORD_FIXTURE = fixturePath('wrong-password');
const ONLY_ALLOWED_TEST = /^TC-001-19 /;
const ALLOWED_FILE = 'tests/api/auth-login-api.spec.ts';

describe('Wrong-password limit — positive', () => {
  it('TC-001-40 at most one wrong-password test targets a real account', () => {
    // Arrange: every Playwright test file of the repository (fixtures excluded).
    const files = collectSpecFiles(REPO_ROOT);

    // Act
    const uses = files.flatMap(({ file, source }) => findWrongPasswordUses(file, source));
    const violations = findWrongPasswordViolations(files);

    // Assert: exactly one use, for account A, in TC-001-19, in the `api` folder (so only the `api`
    // project runs it) and in a describe with retries 0; nothing for account B.
    expect(files.length).toBeGreaterThan(0);
    expect(uses).toHaveLength(1);
    expect(uses[0]).toMatchObject({ file: ALLOWED_FILE, account: 'accountA', inApiFolder: true, retriesZero: true });
    expect(uses[0]?.title).toMatch(ONLY_ALLOWED_TEST);
    expect(violations).toEqual([]);
  });
});

describe('Wrong-password limit — negative', () => {
  it('TC-001-41 a second wrong-password test for a real account is flagged', () => {
    // Arrange: a fixture with two wrong-password tests for account A (one of them retried) and one
    // for account B in a UI file.
    const files = collectSpecFiles(WRONG_PASSWORD_FIXTURE);

    // Act
    const violations = findWrongPasswordViolations(files);

    // Assert: every offending test is named together with its account; the reasons say why.
    expect(violations.map(({ title, account }) => ({ title, account }))).toEqual([
      { title: 'TEST_fixture first wrong password for A', account: 'accountA' },
      { title: 'TEST_fixture second wrong password for A', account: 'accountA' },
      { title: 'TEST_fixture wrong password for B', account: 'accountB' },
    ]);
    expect(violations[1]?.reasons).toEqual(expect.arrayContaining(['more than one wrong-password test for accountA', 'not in a describe with retries 0']));
    expect(violations[2]?.reasons).toEqual(expect.arrayContaining(['account B must never get a wrong password', 'not in tests/api/']));
  });
});
