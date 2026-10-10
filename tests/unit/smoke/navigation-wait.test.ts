import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAVIGATION_WAIT_UNTIL } from '../../../src/config/timeouts';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-101: page object navigations wait only for the page
// document (DOMContentLoaded), so a slow image from a third-party host never uses the 30 s
// navigation budget. Checked on the source text: every navigation call in src/pages passes the
// shared wait constant.
const PAGES_DIR = join(REPO_ROOT, 'src', 'pages');
const DOCUMENT_ONLY_WAIT = 'domcontentloaded';
const NAVIGATION_CALL = /page\.(?:goto|reload)\(/g;
const WAIT_OPTION = 'waitUntil: NAVIGATION_WAIT_UNTIL';

/** Every navigation call in the page objects, as `file: call text up to the closing parenthesis`. */
function navigationCalls(): { file: string; call: string }[] {
  return readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) => {
      const source = readFileSync(join(PAGES_DIR, file), 'utf8');
      return [...source.matchAll(NAVIGATION_CALL)].map((match) => ({
        file,
        call: source.slice(match.index, source.indexOf(';', match.index)),
      }));
    });
}

describe('Page navigation wait — positive', () => {
  it('TC-000-186 every page object navigation waits only for the document', () => {
    // Arrange
    const calls = navigationCalls();

    // Act
    const withoutWait = calls.filter(({ call }) => !call.includes(WAIT_OPTION));

    // Assert: the shared wait is the document only, and every navigation call uses it.
    expect(NAVIGATION_WAIT_UNTIL).toBe(DOCUMENT_ONLY_WAIT);
    expect(calls.length).toBeGreaterThan(0);
    expect(withoutWait).toEqual([]);
  });
});
