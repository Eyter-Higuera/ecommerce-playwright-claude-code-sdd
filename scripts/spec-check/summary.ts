import type { SpecInfo } from './parse-spec';
import type { TraceRow, TraceStatus } from './rules';

// Requirements coverage (Spec 000, RF-86): `spec:check --summary` turns the traceability rows of
// RF-42 into one row per spec. It is the coverage reported for the API and UI tests, whose
// third-party target cannot be measured as code. Pure: run.ts prints and saves the result.

export const REQUIREMENTS_STAGE = 'Requirements coverage';
const PERCENT = 100;

export interface SpecCoverage {
  spec: string;
  rfs: number;
  testCases: number;
  automated: number;
  manual: number;
  skipped: number;
  missing: number;
}

export interface RequirementsSummary {
  stage: typeof REQUIREMENTS_STAGE;
  specs: SpecCoverage[];
}

/** RF-86: per spec, its RFs and its test cases counted once each (a TC may cover several RFs). */
export function requirementsSummary(specs: SpecInfo[], rows: TraceRow[]): RequirementsSummary {
  return {
    stage: REQUIREMENTS_STAGE,
    specs: specs.map((spec) => {
      const statusByTestCase = new Map<string, TraceStatus>();
      for (const row of rows) if (row.spec === spec.id) statusByTestCase.set(row.testCase, row.status);
      const count = (status: TraceStatus) => [...statusByTestCase.values()].filter((value) => value === status).length;
      return {
        spec: spec.id,
        rfs: spec.rfs.length,
        testCases: statusByTestCase.size,
        automated: count('automated'),
        manual: count('manual'),
        skipped: count('skipped'),
        missing: count('missing'),
      };
    }),
  };
}

/** Automated test cases over all the spec's test cases, or "—" when it has none. */
export function automatedPercent(spec: SpecCoverage): string {
  return spec.testCases === 0 ? '—' : `${String(Math.round((spec.automated / spec.testCases) * PERCENT))} %`;
}

/** RF-86: the Markdown table of the job summary and the log. */
export function renderRequirementsSummary(summary: RequirementsSummary): string {
  const rows = summary.specs.map((spec) =>
    `| ${spec.spec} | ${String(spec.rfs)} | ${String(spec.testCases)} | ${String(spec.automated)} | ${String(spec.manual)} | ${String(spec.skipped)} | ${String(spec.missing)} | ${automatedPercent(spec)} |`);
  return [
    `### ${summary.stage}`,
    '',
    '| Spec | RFs | Test cases | Automated | Manual | Skipped | Missing | Automated % |',
    '|------|----:|-----------:|----------:|-------:|--------:|--------:|------------:|',
    ...rows,
    '',
  ].join('\n');
}
