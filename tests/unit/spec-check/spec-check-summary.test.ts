import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runSpecCheck } from '../../../scripts/spec-check/run';
import { makeEmptyDir } from '../helpers/run-cli';
import { SAMPLE_SPEC_DIR, SpecCheckRepo, specFile } from './spec-check-fixture';

// Spec 000 — Framework foundation. RF-86: `spec:check --summary` reports the requirements coverage
// of every spec (RFs, test cases by traceability status and the automated percentage) in the log
// and the GitHub job summary, without changing the check's result. It is the coverage of the API
// and UI tests, whose third-party target cannot be measured as code.
const TEST_CASES = `${SAMPLE_SPEC_DIR}/test-cases.md`;
const EXISTING_SUMMARY_LINE = '## Earlier step';
const HEADER = '| Spec | RFs | Test cases | Automated | Manual | Skipped | Missing | Automated % |';

/**
 * Spec 900 (status test-cases-approved, so a missing test is only a warning): 3 RFs and 4 TCs —
 * 2 automated, 1 manual, 1 missing. Spec 901 is a draft with 2 RFs and no test-cases.md.
 */
function repoForSummary(): SpecCheckRepo {
  const repo = new SpecCheckRepo();
  repo.write(TEST_CASES, `${repo.read(TEST_CASES)}\n### TC-900-04 — TEST_missing\n| Field | Value |\n|---|---|\n| Requirement | RF-3 |\n| Automate | Y |\n`);
  return repo.write('specs/901-draft/spec.md', specFile('901', 'draft', 2));
}

describe('spec:check --summary — positive', () => {
  it('TC-000-126 spec:check --summary reports requirements coverage per spec', () => {
    // Arrange: a job summary an earlier step already wrote to.
    const repo = repoForSummary();
    const dir = makeEmptyDir('TEST_req_summary_');
    const stepSummaryPath = join(dir, 'step-summary.md');
    const summaryJsonPath = join(dir, 'summary.json');
    writeFileSync(stepSummaryPath, `${EXISTING_SUMMARY_LINE}\n`);

    // Act
    const plain = runSpecCheck({ rootDir: repo.root });
    const withSummary = runSpecCheck({ rootDir: repo.root, summary: { summaryJsonPath, stepSummaryPath } });

    // Assert: one row per spec; the percentage is over all test cases; a spec without test cases
    // has no percentage; the table is printed and appended to the job summary; the result of the
    // check (and its warning for TC-900-04) is unchanged.
    const output = withSummary.output.join('\n');
    expect(output).toContain(HEADER);
    expect(output).toContain('| 900 | 3 | 4 | 2 | 1 | 0 | 1 | 50 % |');
    expect(output).toContain('| 901 | 2 | 0 | 0 | 0 | 0 | 0 | — |');
    const written = readFileSync(stepSummaryPath, 'utf8');
    expect(written.startsWith(`${EXISTING_SUMMARY_LINE}\n`)).toBe(true);
    expect(written).toContain('| 900 | 3 | 4 | 2 | 1 | 0 | 1 | 50 % |');
    expect(JSON.parse(readFileSync(summaryJsonPath, 'utf8'))).toMatchObject({
      stage: 'Requirements coverage',
      specs: [
        { spec: '900', rfs: 3, testCases: 4, automated: 2, manual: 1, skipped: 0, missing: 1 },
        { spec: '901', rfs: 2, testCases: 0, automated: 0, manual: 0, skipped: 0, missing: 0 },
      ],
    });
    expect(withSummary.exitCode).toBe(plain.exitCode);
    expect(withSummary.warnings).toEqual(plain.warnings);
  });
});
