import { describe, expect, it } from 'vitest';
import { CLI_TEST_TIMEOUT_MS, fixturePath, runVitest } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-5: the unit runner must exit 0 only when every test passes,
// so CI can trust its exit code. Each fixture is a tiny, isolated Vitest project run in a child
// process, which keeps these tests independent of the repository's own unit suite.
const FAILING_TEST_NAME = 'TEST_fixture fails';
const SUCCESS_EXIT_CODE = 0;

describe('Vitest runner — positive', () => {
  it('TC-000-08 test:unit exits 0 when all unit tests pass', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a fixture project whose only test passes.
    const projectDir = fixturePath('vitest', 'passing');

    // Act: run Vitest on it exactly as `npm run test:unit` would (`vitest run`).
    const result = runVitest(projectDir);

    // Assert: success exit code and exactly one passed test in the summary.
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toMatch(/Tests\s+1 passed \(1\)/);
  });
});

describe('Vitest runner — negative', () => {
  it('TC-000-09 test:unit exits non-zero when a unit test fails', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a fixture project whose only test fails.
    const projectDir = fixturePath('vitest', 'failing');

    // Act
    const result = runVitest(projectDir);

    // Assert: a failing test must break the run and be named in the output.
    expect(result.exitCode).not.toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toMatch(/Tests\s+1 failed \(1\)/);
    expect(result.output).toContain(FAILING_TEST_NAME);
  });
});

describe('Vitest runner — boundary', () => {
  it('TC-000-12 unit suite runs with no environment variables and no .env file', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    // Arrange: a fixture project that imports the framework configuration modules and loads the
    // configuration. Its folder has no `.env`, and the child gets only OS variables (no RF-13
    // variable), the emptiest environment a unit run can have.
    const projectDir = fixturePath('vitest', 'no-env');

    // Act
    const result = runVitest(projectDir);

    // Assert: importing and loading configuration needs no variable (RF-7).
    expect(result.exitCode).toBe(SUCCESS_EXIT_CODE);
    expect(result.output).toMatch(/Tests\s+1 passed \(1\)/);
    expect(result.output).not.toContain('Missing required environment variable');
  });
});
