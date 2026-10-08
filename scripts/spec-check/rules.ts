import { statusRank, type SpecInfo } from './parse-spec';
import type { TestCaseInfo } from './parse-test-cases';
import type { TestDeclaration } from './scan-titles';

// Traceability rules of `npm run spec:check` (Spec 000, RF-31 to RF-39). Pure: the runner reads
// the files, the rules only compare specs, test cases and test declarations. Every message names
// what is wrong (test, TC, RF, spec, file) so it can be fixed without reading the checker.

export interface SpecWithTestCases extends SpecInfo {
  /** Undefined when the spec folder has no test-cases.md. */
  testCases: TestCaseInfo[] | undefined;
  testCasesFile: string;
}

/** RF-42: traceability status of a test case. */
export type TraceStatus = 'automated' | 'skipped' | 'manual' | 'missing';

/** One row of docs/traceability.md: Spec / RF / TC / test file / status (RF-42). */
export interface TraceRow {
  spec: string;
  rf: string;
  testCase: string;
  testFiles: string[];
  status: TraceStatus;
}

export interface RuleResult {
  errors: string[];
  warnings: string[];
  rows: TraceRow[];
}

/** From this status on, test cases are approved (RF-38, RF-39). */
const TEST_CASES_APPROVED = 'test-cases-approved';

/** A test title must start with a TC ID followed by a space (or end there). */
export const TC_ID_AT_START = /^(TC-(\d{3})-\d{2})(?=\s|$)/;

const describeTest = (test: TestDeclaration): string => `"${test.title ?? '<non-literal title>'}" (${test.file}:${String(test.line)})`;

/** TC ID at the start of a test title, or undefined. */
export function leadingTcId(test: TestDeclaration): string | undefined {
  return test.title === undefined ? undefined : TC_ID_AT_START.exec(test.title)?.[1];
}

function groupTestsById(tests: TestDeclaration[]): Map<string, TestDeclaration[]> {
  const byId = new Map<string, TestDeclaration[]>();
  for (const test of tests) {
    const id = leadingTcId(test);
    if (id !== undefined) byId.set(id, [...(byId.get(id) ?? []), test]);
  }
  return byId;
}

function statusOf(testCase: TestCaseInfo, tests: TestDeclaration[]): TraceStatus {
  if (!testCase.automate) return 'manual';
  if (tests.length === 0) return 'missing';
  return tests.every((test) => test.skipped) ? 'skipped' : 'automated';
}

export function checkTraceability(specs: SpecWithTestCases[], tests: TestDeclaration[]): RuleResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: TraceRow[] = [];
  const specIds = new Set(specs.map((spec) => spec.id));
  const testsById = groupTestsById(tests);

  for (const test of tests) {
    const id = leadingTcId(test);
    // RF-31: every test title starts with a TC ID (an ID only in the describe title does not count).
    if (id === undefined) {
      errors.push(`Test title does not start with a TC ID (TC-NNN-XX): ${describeTest(test)}`);
      continue;
    }
    // RF-36: the TC ID must belong to an existing spec folder.
    const specId = id.slice('TC-'.length, 'TC-NNN'.length);
    if (!specIds.has(specId)) errors.push(`Test ${describeTest(test)} uses ${id}, but spec ${specId} does not exist`);
    // RF-37: skipped tests count as existing tests, with a warning.
    if (test.skipped) warnings.push(`Test ${describeTest(test)} for ${id} is skipped`);
  }

  // RF-34: one test per TC ID.
  for (const [id, claimed] of testsById) {
    if (claimed.length > 1) errors.push(`${id} is used by more than one test: ${claimed.map(describeTest).join(', ')}`);
  }

  for (const spec of specs) {
    const rfs = new Set(spec.rfs);
    const seen = new Set<string>();
    const testCasesApproved = statusRank(spec.status) >= statusRank(TEST_CASES_APPROVED);

    // RF-38: test-cases.md may be missing only before test-case approval.
    if (spec.testCases === undefined) {
      if (testCasesApproved) errors.push(`Spec ${spec.id} (${spec.dir}) is ${spec.status} but has no test-cases.md`);
      continue;
    }

    // RF-39: once test cases are approved, every RF needs at least one TC.
    if (testCasesApproved) {
      const covered = new Set(spec.testCases.flatMap((testCase) => testCase.requirements));
      for (const rf of spec.rfs.filter((id) => !covered.has(id))) {
        errors.push(`${rf} of spec ${spec.id} has no test case (${spec.testCasesFile})`);
      }
    }

    for (const testCase of spec.testCases) {
      // RF-35: a TC ID is defined once per test-cases.md.
      if (seen.has(testCase.id)) errors.push(`${testCase.id} is defined more than once in ${spec.testCasesFile}`);
      seen.add(testCase.id);
      // RF-32: a test case may only reference RFs of its own spec.
      for (const rf of testCase.requirements.filter((requirement) => !rfs.has(requirement))) {
        errors.push(`${testCase.id} references ${rf}, which does not exist in spec ${spec.id} (${spec.testCasesFile})`);
      }
      // RF-33: an automated TC needs a test whose title starts with its ID (skip/fixme counts).
      const testsOfCase = testsById.get(testCase.id) ?? [];
      const status = statusOf(testCase, testsOfCase);
      if (status === 'missing') errors.push(`${testCase.id} is marked Automate: Y but no test title starts with it (${spec.testCasesFile})`);
      const testFiles = [...new Set(testsOfCase.map((test) => test.file))];
      for (const rf of testCase.requirements) rows.push({ spec: spec.id, rf, testCase: testCase.id, testFiles, status });
    }
  }

  return { errors, warnings, rows };
}
