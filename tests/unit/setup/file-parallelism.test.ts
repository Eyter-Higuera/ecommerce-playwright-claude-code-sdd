import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-102: Vitest runs the unit test files one at a time, so the
// tests that start a CLI child process (Playwright, Vitest, tsc, ESLint) never compete for memory
// and never reach the 60 s spawn limit because of each other. Checked on the source text of the
// repository config (Vitest cannot load its own config module inside a test) and on the three
// unit-test scripts, which must not turn file parallelism back on.
const UNIT_SCRIPTS = ['test:unit', 'test:unit:report', 'test:unit:ci'];
const ONE_FILE_AT_A_TIME = /^\s*fileParallelism:\s*false,/m;
const PARALLELISM_OPTION = /--file-?parallelism/i;

function packageScripts(): Record<string, string> {
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  return manifest.scripts;
}

describe('Unit file parallelism — positive', () => {
  it('TC-000-187 unit test files run one at a time', () => {
    // Arrange
    const config = readFileSync(join(REPO_ROOT, 'vitest.config.mts'), 'utf8');
    const scripts = packageScripts();

    // Act
    const missingScripts = UNIT_SCRIPTS.filter((name) => scripts[name] === undefined);
    const scriptsTurningItOn = UNIT_SCRIPTS.filter((name) => PARALLELISM_OPTION.test(scripts[name] ?? ''));

    // Assert: the config disables file parallelism and no unit-test script overrides it.
    expect(config).toMatch(ONE_FILE_AT_A_TIME);
    expect(missingScripts).toEqual([]);
    expect(scriptsTurningItOn).toEqual([]);
  });
});
