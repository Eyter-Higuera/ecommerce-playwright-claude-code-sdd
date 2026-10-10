import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-93: VS Code tasks let the user pick a layer, a suite and a
// browser and run that selection locally, and pick a branch, a suite, a browser and a layer and
// start that manual GitHub run, then watch it. The task files are plain JSON (no comments).
const VSCODE_DIR = join(REPO_ROOT, '.vscode');
const PICKERS = {
  layer: ['all', 'unit', 'api', 'ui'],
  suite: ['smoke', 'regression'],
  browser: ['chromium', 'firefox', 'webkit', 'all'],
  branch: ['eyter_dev', 'release', 'main', 'production'],
};
const GITHUB_RUN = 'gh workflow run ci.yml --ref ${input:branch} -f suite=${input:suite} -f browser=${input:browser} -f layer=${input:layer}';

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
    const local = commandOf('npm run ci:run-suite');

    // Assert: one picker per choice with exactly the allowed values ...
    for (const [id, options] of Object.entries(PICKERS)) {
      expect(inputs.find((input) => input.id === id), id).toMatchObject({ type: 'pickString', options });
    }
    // ... the local run passes the picked values to the shared selector (RF-90) ...
    expect(local?.options?.env).toEqual({ SUITE: '${input:suite}', BROWSER: '${input:browser}', LAYER: '${input:layer}' });
    for (const command of ['npm run test:unit:report', 'npm run test:unit:ci', 'npx playwright show-report', GITHUB_RUN, 'gh run watch']) {
      expect(commandOf(command), command).toBeDefined();
    }
    // ... and the editor suggests the test explorers.
    expect(recommendations).toEqual(expect.arrayContaining(['ms-playwright.playwright', 'vitest.explorer']));
  });
});
