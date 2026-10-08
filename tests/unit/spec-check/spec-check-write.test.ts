import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TRACEABILITY_FILE, runSpecCheck } from '../../../scripts/spec-check/run';
import { SAMPLE_SPEC_DIR, SpecCheckRepo } from './spec-check-fixture';

// Spec 000 — Framework foundation. RF-42 / RF-43 (and RF-37's `skipped` status): `--write`
// regenerates docs/traceability.md with one row per Spec / RF / TC / test file / status, only when
// asked, and fails loudly when the file cannot be written.
const SUCCESS_EXIT_CODE = 0;
const TEST_CASES = `${SAMPLE_SPEC_DIR}/test-cases.md`;
const UI_TESTS = 'tests/ui/sample.spec.ts';

/** Fixture with one TC in each status: 01 automated, 02 skipped, 03 manual, 04 missing. */
function repoWithAllStatuses(): SpecCheckRepo {
  const repo = new SpecCheckRepo()
    .replace(UI_TESTS, "test('TC-900-02", "test.skip('TC-900-02")
    .remove('docs');
  return repo.write(TEST_CASES, `${repo.read(TEST_CASES)}\n### TC-900-04 — TEST_missing\n| Field | Value |\n|---|---|\n| Requirement | RF-3 |\n| Automate | Y |\n`);
}

function rowOf(matrix: string, testCase: string): string | undefined {
  return matrix.split('\n').find((line) => line.includes(`| ${testCase} |`));
}

describe('spec:check --write — positive', () => {
  it('TC-000-58 --write creates the traceability file with all four statuses', () => {
    // Arrange: no docs/traceability.md yet; one TC per status (the `missing` one is a violation).
    const repo = repoWithAllStatuses();

    // Act
    const result = runSpecCheck({ rootDir: repo.root, write: true });
    const matrix = repo.read(TRACEABILITY_FILE);

    // Assert: the file is created even though a violation exists (so `missing` rows are visible),
    // with one row per Spec / RF / TC / test file / status, and the run still fails.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(matrix).toContain('| Spec | RF | Test case | Test file | Status |');
    expect(rowOf(matrix, 'TC-900-01')).toBe('| 900 | RF-1 | TC-900-01 | tests/unit/sample.test.ts | automated |');
    expect(rowOf(matrix, 'TC-900-02')).toBe('| 900 | RF-2 | TC-900-02 | tests/ui/sample.spec.ts | skipped |');
    expect(rowOf(matrix, 'TC-900-03')).toBe('| 900 | RF-3 | TC-900-03 | — | manual |');
    expect(rowOf(matrix, 'TC-900-04')).toBe('| 900 | RF-3 | TC-900-04 | — | missing |');
  });
});

describe('spec:check --write — negative', () => {
  it('TC-000-59 spec:check without --write leaves the traceability file unchanged', () => {
    // Arrange: the valid fixture with an existing, deliberately stale matrix.
    const stale = '# TEST_stale matrix\n';
    const repo = new SpecCheckRepo().write(TRACEABILITY_FILE, stale);

    // Act
    const result = runSpecCheck({ rootDir: repo.root });

    // Assert: a plain check never touches the file.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(repo.read(TRACEABILITY_FILE)).toBe(stale);
  });

  it('TC-000-60 --write fails with a reason when the file cannot be written', () => {
    // Arrange: docs/traceability.md is a folder, so it cannot be written as a file. Unlike a
    // read-only file, this also fails for root, which is how CI's Playwright image runs.
    const repo = new SpecCheckRepo().remove(TRACEABILITY_FILE).write(`${TRACEABILITY_FILE}/TEST_placeholder`, '');
    const path = join(repo.root, TRACEABILITY_FILE);

    // Act
    const result = runSpecCheck({ rootDir: repo.root, write: true });

    // Assert: the run fails, naming the file and the OS reason; the folder is left as it was.
    const error = result.errors.find((message) => message.includes(TRACEABILITY_FILE));
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(error).toMatch(/Cannot write docs\/traceability\.md: .*E(ISDIR|PERM|ACCES)/);
    expect(statSync(path).isDirectory()).toBe(true);
  });
});
