import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-95: every test or pipeline failure found and fixed is recorded
// in docs/bug-log.md, one row per failure in a six-column table (date, bug, the ✅ and ❌ marks only,
// cause and solution), and AGENTS.md makes the AI fix and record any red run before finishing a task.
const BUG_LOG = join(REPO_ROOT, 'docs', 'bug-log.md');
const AGENTS = join(REPO_ROOT, 'AGENTS.md');
const COLUMN_NAMES = ['Date', 'Bug / failure', 'Passed ✅', 'Failed ❌', 'Cause', 'Solution'];
const HEADER = `| ${COLUMN_NAMES.join(' | ')} |`;
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const PASSED_MARK = '✅';
const FAILED_MARK = '❌';

/** Cells of a Markdown table row (pipes inside backticks are not used in the log). */
const cellsOf = (row: string): string[] => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());

describe('Bug log — positive', () => {
  it('TC-000-151 the bug log has its table and the AI rule', () => {
    // Arrange
    const log = readFileSync(BUG_LOG, 'utf8').replaceAll('\r\n', '\n');
    const agents = readFileSync(AGENTS, 'utf8');

    // Act
    const tableLines = log.split('\n').filter((line) => line.startsWith('|'));
    const rows = tableLines.slice(2);

    // Assert: the agreed header and a legend for every column ...
    expect(tableLines[0]).toBe(HEADER);
    for (const column of COLUMN_NAMES) expect(log, column).toContain(`**${column}**`);
    // ... every row has a date, the bug, only the marks in Passed and Failed, a cause and a solution ...
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const [date, bug, passed, failed, cause, solution] = cellsOf(row);
      expect(cellsOf(row), row).toHaveLength(COLUMN_NAMES.length);
      expect(date, row).toMatch(DATE_FORMAT);
      expect(bug, row).not.toBe('');
      expect(['', PASSED_MARK], row).toContain(passed);
      expect(failed, row).toBe(FAILED_MARK);
      expect(cause, row).not.toBe('');
      expect(solution, row).not.toBe('');
    }
    // ... and the agent must fix and record any red run before finishing a task.
    expect(agents).toMatch(/red test or pipeline run[^\n]*docs\/bug-log\.md/);
  });
});
