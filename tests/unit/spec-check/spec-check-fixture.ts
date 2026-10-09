import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fixturePath, makeEmptyDir } from '../helpers/run-cli';

// Helper for the spec:check unit tests: each test gets its own copy of the valid fixture
// repository (tests/fixtures/spec-check/valid) in a temp folder and changes only what its TC needs.

export const VALID_FIXTURE = fixturePath('spec-check', 'valid');
export const SAMPLE_SPEC_DIR = 'specs/900-sample';

export class SpecCheckRepo {
  readonly root: string;

  constructor() {
    this.root = makeEmptyDir('TEST_spec_check_');
    cpSync(VALID_FIXTURE, this.root, { recursive: true });
  }

  read(relativePath: string): string {
    return readFileSync(join(this.root, relativePath), 'utf8');
  }

  write(relativePath: string, content: string): this {
    const path = join(this.root, relativePath);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    return this;
  }

  /** Replaces text in a file of the copy; fails loudly if the text is not there. */
  replace(relativePath: string, search: string, replacement: string): this {
    const content = this.read(relativePath);
    if (!content.includes(search)) throw new Error(`"${search}" not found in ${relativePath}`);
    return this.write(relativePath, content.replace(search, replacement));
  }

  remove(relativePath: string): this {
    rmSync(join(this.root, relativePath), { recursive: true, force: true });
    return this;
  }
}

/** Minimal spec.md with a status and RF-1..RF-<rfCount>. */
export function specFile(specId: string, status: string, rfCount: number): string {
  const rfs = Array.from({ length: rfCount }, (_, index) => `- RF-${String(index + 1)}: THE SYSTEM SHALL do TEST_${String(index + 1)}. Source: fixture`);
  return `# Spec ${specId} — TEST_fixture\n\nStatus: ${status}\n\n## Functional requirements (acceptance criteria in EARS)\n${rfs.join('\n')}\n`;
}

/** Minimal test-cases.md: one manual (Automate: N) TC per given RF, so no test file is needed. */
export function manualTestCasesFile(specId: string, rfs: string[]): string {
  const cases = rfs.map((rf, index) => {
    const id = `TC-${specId}-${String(index + 1).padStart(2, '0')}`;
    return `### ${id} — TEST_case\n| Field | Value |\n|---|---|\n| Requirement | ${rf} |\n| Automate | N — fixture manual case |\n`;
  });
  return `# Test Cases — Spec ${specId}\n\n## Test cases\n\n${cases.join('\n')}`;
}

/** Minimal Vitest test file content with the given `it(...)` titles. */
export function vitestFile(titles: string[]): string {
  const tests = titles.map((title) => `  it('${title}', () => undefined);`).join('\n');
  return `import { describe, it } from 'vitest';\n\ndescribe('TEST_group', () => {\n${tests}\n});\n`;
}
