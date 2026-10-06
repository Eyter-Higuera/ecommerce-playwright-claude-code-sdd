---
name: tasks-generator
description: Breaks an approved SDD plan into small, ordered, verifiable tasks (tasks.md) with checkboxes, covered RF/TC and a "Done when" line each. Run only when the user invokes /tasks-generator.
disable-model-invocation: true
---

# Tasks Generator

## Preconditions (STOP if any fails and name the missing step)
- The user explicitly asked for the tasks of a specific spec.
- `specs/NNN-<feature>/plan.md` has `Status: approved`.
- If `tasks.md` already exists, ask: "tasks.md already exists. Overwrite it or update it? (overwrite/update/cancel)".
  Never untick a task that is already done.

## Read first
`docs/constitution.md`, the spec's `spec.md`, `test-cases.md` and `plan.md`.

## Rules
- Do NOT write code.
- Each task takes 20-30 minutes at most. Split anything bigger.
- Tasks are in dependency order; no circular dependencies.
- Tests first: each task that adds behavior names the TCs whose tests are written in that task.
- Every TC with `Automate: Y` belongs to exactly one task.
- Each task has a verifiable `Done when:` line: a command plus its expected result
  (e.g. `npx playwright test tests/ui/cart.spec.ts --grep "TC-004-0[1-3]" --project=chromium` passes).
  Never "works correctly" or other unverifiable wording.
- Typical order: shared setup (config, fixtures, factories) → Page Objects / API clients needed
  first → tests per RF group → mocked/edge cases → cross-browser run → traceability update.
- Everything is written in English.

## Steps
1. Write `specs/NNN-<feature>/tasks.md` using `tasks-template.md` in this skill folder, with `Status: draft`.
   Each task: checkbox, `T<n> — <imperative title>`, `Covers:`, `Depends on:`, `Files:`, `Done when:`.
2. Fill the **Coverage check** table (every `Automate: Y` TC → its task).
3. **Self-check gate** (fix before showing):
   - [ ] Every `Automate: Y` TC appears in exactly one task
   - [ ] Every RF is covered by at least one task
   - [ ] No task depends on a later task
   - [ ] Every task has a verifiable `Done when:`
4. Show the task list (titles + estimates) and ask: "Do you approve the tasks for spec NNN?"
5. On an explicit yes, set `Status: approved` in tasks.md.
   Next step: `/implementation-generator Implement ONLY task T1 of spec NNN`. STOP.
