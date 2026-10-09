import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLI_TEST_TIMEOUT_MS, REPO_ROOT, fixturePath, runNodeScript } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-4: `npm run typecheck` type-checks all framework and test
// code in strict mode and fails on any type error. The tests run the real compiler, with the same
// options as the repository, in a child process.
const TSC_CLI = join(REPO_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
const SUCCESS_EXIT_CODE = 0;
const INVALID_FIXTURE_FILE = 'invalid.ts';
const STRING_TO_NUMBER = { line: 5, code: 'TS2322' };
const IMPLICIT_ANY = { line: 8, code: 'TS7006' };

function runTypecheck(projectFile: string) {
  // Same compiler call as `npm run typecheck`; plain output keeps "file(line,col): error" stable.
  return runNodeScript(TSC_CLI, ['--noEmit', '--pretty', 'false', '-p', projectFile], { cwd: REPO_ROOT });
}

describe('Typecheck — positive', () => {
  it('TC-000-06 typecheck passes on the repository code', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: the repository tsconfig (strict, all of src/, tests/, scripts/ and root configs).
    const projectFile = join(REPO_ROOT, 'tsconfig.json');

    // Act
    const result = runTypecheck(projectFile);

    // Assert: no type error anywhere in the repository.
    expect(result.output).not.toContain('error TS');
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
  });
});

describe('Typecheck — negative', () => {
  it('TC-000-07 typecheck fails on a strict-mode type error', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a fixture project that extends the repository tsconfig, so the same strict
    // options apply, and contains one wrong assignment and one implicit `any`.
    const projectFile = fixturePath('typecheck', 'invalid', 'tsconfig.json');

    // Act
    const result = runTypecheck(projectFile);

    // Assert: the run fails and each error names the fixture file, its line and the error code.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    for (const error of [STRING_TO_NUMBER, IMPLICIT_ANY]) {
      expect(result.output).toMatch(new RegExp(`${INVALID_FIXTURE_FILE}\\(${error.line},\\d+\\): error ${error.code}`));
    }
  });
});
