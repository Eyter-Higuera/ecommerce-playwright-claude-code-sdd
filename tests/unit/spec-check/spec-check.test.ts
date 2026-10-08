import { describe, expect, it } from 'vitest';
import { runSpecCheck } from '../../../scripts/spec-check/run';
import { SAMPLE_SPEC_DIR, SpecCheckRepo, manualTestCasesFile, specFile, vitestFile } from './spec-check-fixture';

// Spec 000 — Framework foundation. RF-31 to RF-41: `npm run spec:check` is the SDD traceability
// gate. Each test runs the real checker in-process against its own copy of a small fixture
// repository (spec 900, its test cases and two tests), changed only as its TC requires.
const SUCCESS_EXIT_CODE = 0;
const TEST_CASES = `${SAMPLE_SPEC_DIR}/test-cases.md`;
const EXTRA_TESTS = 'tests/unit/extra.test.ts';
const UI_TESTS = 'tests/ui/sample.spec.ts';

describe('spec:check — positive', () => {
  it('TC-000-50 spec:check passes a fully traceable fixture', () => {
    // Arrange: spec 900 test-cases-approved, unique TCs, every RF covered, a test per Automate Y TC.
    const repo = new SpecCheckRepo();

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert
    expect(result.errors).toEqual([]);
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(result.output.join('\n')).not.toContain('No specs found');
  });

  it('TC-000-54 a skipped test satisfies its TC and is reported as skipped', () => {
    // Arrange: TC-900-03 becomes Automate: Y and its only test is a test.skip.
    const repo = new SpecCheckRepo()
      .replace(TEST_CASES, '| Automate        | N — fixture manual case |', '| Automate        | Y |')
      .write('tests/ui/skipped.spec.ts', "import { test } from '@playwright/test';\n\ntest.skip('TC-900-03 TEST_page three is shown', () => undefined);\n");

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: a warning, not a failure, and the TC's traceability status is `skipped`.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(result.warnings.some((warning) => warning.includes('TC-900-03'))).toBe(true);
    expect(result.rows.filter((row) => row.testCase === 'TC-900-03').map((row) => row.status)).toEqual(['skipped']);
  });

  it('TC-000-65 spec:check with no specs prints No specs found and passes', () => {
    // Arrange: an empty specs/ folder.
    const repo = new SpecCheckRepo().remove('specs').write('specs/.gitkeep', '');

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: a repository before its first spec is not a failure.
    expect(result.output).toContain('No specs found');
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
  });
});

describe('spec:check — negative', () => {
  it('TC-000-51 spec:check rejects titles without a valid TC ID', () => {
    // Arrange: no ID, a malformed ID, and an ID only in the describe title.
    const repo = new SpecCheckRepo()
      .write(EXTRA_TESTS, vitestFile(['logs in', 'TC-1-3 logs in']))
      .write('tests/unit/describe-only.test.ts', "import { describe, it } from 'vitest';\n\ndescribe('TC-900-01 group', () => {\n  it('opens the page', () => undefined);\n});\n");

    // Act
    const result = runSpecCheck({ rootDir: repo.root });
    const report = result.errors.join('\n');

    // Assert: the run fails and every offending test is named with its file.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(report).toContain('"logs in"');
    expect(report).toContain('"TC-1-3 logs in"');
    expect(report).toContain('"opens the page"');
    expect(report).toContain('tests/unit/describe-only.test.ts');
  });

  it('TC-000-53 spec:check fails when an Automate Y TC has no test', () => {
    // Arrange: the only test of TC-900-02 (Automate: Y) is removed.
    const repo = new SpecCheckRepo().remove(UI_TESTS);

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: the untested TC is named.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.errors.some((error) => error.includes('TC-900-02'))).toBe(true);
  });

  it('TC-000-55 spec:check rejects two tests with the same TC ID', () => {
    // Arrange: a second file with two tests claiming TC-900-01 (the fixture already has one).
    const repo = new SpecCheckRepo().write(EXTRA_TESTS, vitestFile(['TC-900-01 first', 'TC-900-01 second']));

    // Act
    const result = runSpecCheck({ rootDir: repo.root });
    const duplicate = result.errors.find((error) => error.includes('TC-900-01') && error.includes('more than one test'));

    // Assert: one error naming every test that claims the ID.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(duplicate).toContain('"TC-900-01 first"');
    expect(duplicate).toContain('"TC-900-01 second"');
  });

  it('TC-000-56 spec:check rejects a TC ID defined twice in test-cases.md', () => {
    // Arrange: TC-900-02 is defined a second time at the end of the file.
    const repo = new SpecCheckRepo();
    repo.write(TEST_CASES, `${repo.read(TEST_CASES)}\n### TC-900-02 — TEST_duplicate\n| Field | Value |\n|---|---|\n| Requirement | RF-2 |\n| Automate | Y |\n`);

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: the TC ID and the file are named.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.errors.some((error) => error.includes('TC-900-02') && error.includes(TEST_CASES))).toBe(true);
  });

  it('TC-000-57 spec:check rejects a TC ID of a nonexistent spec', () => {
    // Arrange: a test claiming spec 999, which has no folder.
    const repo = new SpecCheckRepo().write(EXTRA_TESTS, vitestFile(['TC-999-01 TEST_title']));

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: the test and its TC ID are named.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.errors.some((error) => error.includes('"TC-999-01 TEST_title"') && error.includes('TC-999-01'))).toBe(true);
  });

  it('TC-000-52 spec:check rejects a TC referencing a nonexistent RF', () => {
    // Arrange: TC-900-01 now points at RF-99; spec 900 only has RF-1 to RF-3.
    const repo = new SpecCheckRepo().replace(TEST_CASES, '| Requirement     | RF-1 |', '| Requirement     | RF-99 |');

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: the violation names both the TC and the RF.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.errors.some((error) => error.includes('TC-900-01') && error.includes('RF-99'))).toBe(true);
  });
});

// RF-38 / RF-39: which checks apply depends on where the spec is in the SDD flow.
describe('spec:check — spec status', () => {
  it('TC-000-61 specs without test cases pass while draft or approved', () => {
    // Arrange: two new specs, before test-case approval, with no test-cases.md.
    const repo = new SpecCheckRepo()
      .write('specs/901-draft/spec.md', specFile('901', 'draft', 2))
      .write('specs/902-approved/spec.md', specFile('902', 'approved', 2));

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: writing test cases is the next step for them, not a violation.
    expect(result.errors).toEqual([]);
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
  });

  it('TC-000-62 spec without test cases fails once test cases are approved', () => {
    // Arrange: a spec that claims approved test cases but has no test-cases.md.
    const repo = new SpecCheckRepo().write('specs/903-inconsistent/spec.md', specFile('903', 'test-cases-approved', 2));

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: the inconsistent spec is named.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.errors.some((error) => error.includes('903'))).toBe(true);
  });

  it('TC-000-63 spec:check rejects an RF without TC after test-case approval', () => {
    // Arrange: spec 904 (test-cases-approved) has RF-1..RF-5; its test cases cover RF-1..RF-4.
    const repo = new SpecCheckRepo()
      .write('specs/904-orphan/spec.md', specFile('904', 'test-cases-approved', 5))
      .write('specs/904-orphan/test-cases.md', manualTestCasesFile('904', ['RF-1', 'RF-2', 'RF-3', 'RF-4']));

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: the uncovered RF is named.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.errors.some((error) => error.includes('RF-5') && error.includes('904'))).toBe(true);
  });

  it('TC-000-64 orphan RFs are not checked before test-case approval', () => {
    // Arrange: spec 905 is only `approved`; its draft test cases leave RF-2 uncovered.
    const repo = new SpecCheckRepo()
      .write('specs/905-in-progress/spec.md', specFile('905', 'approved', 2))
      .write('specs/905-in-progress/test-cases.md', manualTestCasesFile('905', ['RF-1']));

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: an unfinished test-case design is not a failure, and RF-2 is not reported.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(result.output.join('\n')).not.toContain('RF-2');
  });
});
