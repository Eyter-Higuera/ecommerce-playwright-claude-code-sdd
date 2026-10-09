import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SPEC_FOLDER, parseSpec } from './parse-spec';
import { parseTestCases } from './parse-test-cases';
import { checkTraceability, type SpecWithTestCases, type TraceRow } from './rules';
import { scanTestDeclarations, type TestDeclaration } from './scan-titles';
import { writeMatrix } from './write-matrix';

// `npm run spec:check` (Spec 000, RF-31 to RF-43): reads specs/ and tests/ under a root folder,
// applies the traceability rules and reports. `--root <dir>` points it at a fixture repository.

export interface SpecCheckOptions {
  rootDir: string;
  write?: boolean;
}

export interface SpecCheckResult {
  exitCode: number;
  errors: string[];
  warnings: string[];
  /** Traceability rows (RF-42), one per Spec / RF / TC. */
  rows: TraceRow[];
  /** Lines printed by the CLI, in order. */
  output: string[];
}

const SPECS_DIR = 'specs';
const TESTS_DIR = 'tests';
/** Intentionally broken inputs of the framework's own unit tests; never real tests. */
const FIXTURES_DIR = 'tests/fixtures';
const TEST_FILE = /\.(spec|test)\.ts$/;
export const NO_SPECS_MESSAGE = 'No specs found';
/** RF-42: the traceability matrix, relative to the repository root. */
export const TRACEABILITY_FILE = 'docs/traceability.md';
const SUCCESS = 0;
const FAILURE = 1;

const toPosix = (path: string): string => path.replaceAll('\\', '/');

function readSpecs(rootDir: string): SpecWithTestCases[] {
  const specsRoot = join(rootDir, SPECS_DIR);
  if (!existsSync(specsRoot)) return [];
  return readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SPEC_FOLDER.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .flatMap((folder) => {
      const dir = `${SPECS_DIR}/${folder}`;
      const specFile = join(rootDir, dir, 'spec.md');
      if (!existsSync(specFile)) return [];
      const id = SPEC_FOLDER.exec(folder)?.[1] ?? '';
      const testCasesFile = `${dir}/test-cases.md`;
      const testCasesPath = join(rootDir, testCasesFile);
      return [{
        ...parseSpec(readFileSync(specFile, 'utf8'), id, dir),
        testCasesFile,
        testCases: existsSync(testCasesPath) ? parseTestCases(readFileSync(testCasesPath, 'utf8')) : undefined,
      }];
    });
}

function readTests(rootDir: string): TestDeclaration[] {
  const testsRoot = join(rootDir, TESTS_DIR);
  if (!existsSync(testsRoot)) return [];
  return readdirSync(testsRoot, { recursive: true, encoding: 'utf8' })
    .map((path) => toPosix(relative(rootDir, join(testsRoot, path))))
    .filter((path) => TEST_FILE.test(path) && !path.startsWith(`${FIXTURES_DIR}/`))
    .sort()
    .flatMap((path) => scanTestDeclarations(path, readFileSync(join(rootDir, path), 'utf8')));
}

export function runSpecCheck(options: SpecCheckOptions): SpecCheckResult {
  const specs = readSpecs(options.rootDir);
  if (specs.length === 0) {
    return { exitCode: SUCCESS, errors: [], warnings: [], rows: [], output: [NO_SPECS_MESSAGE] };
  }

  const { errors, warnings, rows } = checkTraceability(specs, readTests(options.rootDir));
  const written: string[] = [];
  if (options.write) {
    // RF-42: written even when violations exist, so `missing` rows are visible; RF-43: a write
    // failure is an error with the OS reason.
    const writeError = writeMatrix(join(options.rootDir, TRACEABILITY_FILE), rows);
    if (writeError === undefined) written.push(`Wrote ${TRACEABILITY_FILE} (${String(rows.length)} rows)`);
    else errors.push(`Cannot write ${TRACEABILITY_FILE}: ${writeError}`);
  }
  const output = [
    ...written,
    ...warnings.map((warning) => `WARNING: ${warning}`),
    ...errors.map((error) => `ERROR: ${error}`),
    errors.length === 0
      ? `spec:check passed (${String(specs.length)} spec(s))`
      : `spec:check failed with ${String(errors.length)} error(s)`,
  ];
  return { exitCode: errors.length === 0 ? SUCCESS : FAILURE, errors, warnings, rows, output };
}

function main(): void {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf('--root');
  const rootDir = rootIndex >= 0 ? (args[rootIndex + 1] ?? '.') : '.';
  const result = runSpecCheck({ rootDir, write: args.includes('--write') });
  for (const line of result.output) console.log(line);
  process.exitCode = result.exitCode;
}

if (require.main === module) main();
