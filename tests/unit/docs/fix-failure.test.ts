import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../helpers/run-cli';

// Spec 000 — Framework foundation. RF-97: the `/fix-failure` skill turns a failed manual test into
// an explanation, a test-first fix, a green re-run and a bug-log row in one step, and VS Code starts
// it with a task. The agent's behavior is checked live (TC-000-159); this test checks that the skill
// prescribes every step and that the tasks and the README point to it.
const SKILL = join(REPO_ROOT, '.claude', 'skills', 'fix-failure', 'SKILL.md');
const TASKS = join(REPO_ROOT, '.vscode', 'tasks.json');
const README = join(REPO_ROOT, 'README.md');
const REQUIRED_STEPS = [
  'npm run report:failures',
  'npm run report:failures -- --run <id>',
  'No failure found',
  'unit failures first',
  'regression test first',
  'spec change',
  'site outage',
  're-run the failed tests',
  'docs/bug-log.md',
  'never commit or push',
  'never print secrets',
];

describe('fix-failure skill — positive', () => {
  it('TC-000-158 the fix-failure skill and its VS Code tasks are in place', () => {
    // Arrange
    const skill = readFileSync(SKILL, 'utf8').replaceAll('\r\n', '\n');
    const { tasks } = JSON.parse(readFileSync(TASKS, 'utf8')) as { tasks: { label: string; command: string }[] };
    const readme = readFileSync(README, 'utf8');

    // Act
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1] ?? '';
    const commandOf = (label: string) => tasks.find((task) => task.label === label)?.command;

    // Assert: a named skill with a description, prescribing every RF-97 step ...
    expect(frontmatter).toMatch(/^name: fix-failure$/m);
    expect(frontmatter).toMatch(/^description: \S.{40,}$/m);
    for (const step of REQUIRED_STEPS) expect(skill, step).toContain(step);
    // ... two VS Code tasks to list failures and to start the skill, and a README entry point.
    expect(commandOf('Tests: list last failures')).toBe('npm run report:failures');
    expect(commandOf('Claude: analyze and fix last failure')).toBe('claude "/fix-failure"');
    expect(readme).toContain('## When a test fails');
    expect(readme).toContain('/fix-failure <run-id>');
  });
});
