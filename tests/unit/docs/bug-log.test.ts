import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-95: every test or pipeline failure found and fixed is recorded
// in docs/bug-log.md, one row per failure in a five-column table, and AGENTS.md makes the AI fix and
// record any red run before finishing a task.
const BUG_LOG = join(REPO_ROOT, 'docs', 'bug-log.md');
const AGENTS = join(REPO_ROOT, 'AGENTS.md');
const HEADER = '| Bug / failure | Passed ✅ | Failed ❌ | How it is fixed | Solution |';
const COLUMNS = 5;

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
    for (const column of ['Bug / failure', 'Passed ✅', 'Failed ❌', 'How it is fixed', 'Solution']) expect(log, column).toContain(`**${column}**`);
    // ... every row has the five cells and says where it failed ...
    for (const row of rows) {
      const cells = cellsOf(row);
      expect(cells, row).toHaveLength(COLUMNS);
      expect(cells[0], row).not.toBe('');
      expect(cells[2], row).not.toBe('');
    }
    // ... and the agent must fix and record any red run before finishing a task.
    expect(agents).toMatch(/red test or pipeline run[^\n]*docs\/bug-log\.md/);
  });
});
