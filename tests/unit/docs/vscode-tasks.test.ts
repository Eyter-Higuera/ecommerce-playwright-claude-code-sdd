import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-93 / RF-98: VS Code tasks run tests on the user's PC only, with
// the results in the VS Code terminal: the picked layer, suite and browser on the checked-out branch
// or on a picked branch (in a local worktree). RF-100: both run tasks go through `test:local`, which
// then opens the report and starts /fix-failure on failure. No task ever starts or watches a GitHub
// run. The task files are plain JSON (no comments).
const VSCODE_DIR = join(REPO_ROOT, '.vscode');
const PICKERS = {
  layer: ['all', 'unit', 'api', 'ui'],
  suite: ['smoke', 'regression'],
  browser: ['chromium', 'firefox', 'webkit', 'all'],
  branch: ['eyter_dev', 'release', 'main', 'production'],
};

interface Task {
  label: string;
  command: string;
  options?: { env?: Record<string, string> };
}

interface TasksFile {
  tasks: Task[];
  inputs: { id: string; type: string; options?: string[] }[];
}

const readJson = <T>(name: string): T => JSON.parse(readFileSync(join(VSCODE_DIR, name), 'utf8')) as T;

describe('VS Code tasks — positive', () => {
  it('TC-000-148 VS Code tasks cover every local and GitHub selection', () => {
    // Arrange
    const { tasks, inputs } = readJson<TasksFile>('tasks.json');
    const { recommendations } = readJson<{ recommendations: string[] }>('extensions.json');

    // Act
    const commandOf = (command: string) => tasks.find((task) => task.command === command);
    const local = commandOf('npm run test:local -- ci:run-suite');
    const onBranch = commandOf('npm run test:local -- test:branch');

    // Assert: one picker per choice with exactly the allowed values ...
    for (const [id, options] of Object.entries(PICKERS)) {
      expect(inputs.find((input) => input.id === id), id).toMatchObject({ type: 'pickString', options });
    }
    // ... the local runs pass the picked values to the shared selector (RF-90) through test:local (RF-100) ...
    expect(local?.options?.env).toEqual({ SUITE: '${input:suite}', BROWSER: '${input:browser}', LAYER: '${input:layer}' });
    expect(onBranch?.options?.env).toEqual({ BRANCH: '${input:branch}', SUITE: '${input:suite}', BROWSER: '${input:browser}', LAYER: '${input:layer}' });
    for (const command of ['npm run test:unit:report', 'npm run test:unit:ci', 'npx playwright show-report', 'npm run report:failures']) {
      expect(commandOf(command), command).toBeDefined();
    }
    // ... no task talks to GitHub (local only) ...
    for (const task of tasks) expect(task.command, task.label).not.toMatch(/(^|\s)gh\s/);
    // ... and the editor suggests the test explorers.
    expect(recommendations).toEqual(expect.arrayContaining(['ms-playwright.playwright', 'vitest.explorer']));
  });
});
