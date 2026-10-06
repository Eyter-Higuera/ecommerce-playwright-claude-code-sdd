---
name: implementation-generator
description: Implements exactly ONE task from an SDD tasks.md file (tests first, then page objects / API clients / framework code), runs the tests, applies the test review checklist, logs the result in implementation.md, ticks the task and stops. Run only when the user invokes /implementation-generator.
disable-model-invocation: true
---

# Implementation Generator

## Preconditions (STOP if any fails)
- The user named ONE specific task (e.g. "T2 of spec 001"). If not, ask which task.
- The spec has `Status: test-cases-approved` (or later), `plan.md` has `Status: approved`
  and `tasks.md` has `Status: approved`.
- All tasks this task depends on are already ticked.
- The task is not already ticked. If it is, ask whether to redo it.

## Read first
`docs/constitution.md`, `docs/test-review-checklist.md`, the spec's `spec.md`, `test-cases.md`,
`plan.md` and `tasks.md`, plus the existing code in `src/` and `tests/` that the task touches.
Use the code skeletons in `implementation-template.md` (section "Code skeletons").

## Steps
1. **Tests first.** Write the tests for the TCs this task covers before the supporting code.
   - Test title starts with the TC ID: `test('TC-001-03 rejects login with wrong password', ...)`.
   - Tags from the TC: `{ tag: ['@smoke', '@critical'] }`.
   - `describe()` blocks grouped by scenario type (positive / negative / boundary / security).
   - Arrange / Act / Assert separated by blank lines, with comments explaining what is checked and why.
2. **Supporting code.** Page Objects (`src/pages`, `src/components`), API clients (`src/api`),
   schemas, fixtures and `TEST_` data factories, following `plan.md`. Reuse before creating.
   - Locator priority: getByRole > getByLabel > getByText > getByPlaceholder > getByTestId > locator(css).
   - No `waitForTimeout`; use web-first assertions, `waitForURL`, `waitForResponse`.
   - No magic values: named constants; `// TODO: VERIFY` where an assumption was made.
   - Credentials only from env config / fixtures. Unit tests mock every HTTP dependency.
   - Only touch the files listed in the task's `Files:`; if more are needed, say why.
3. **Run** only the relevant tests (e.g. `npx playwright test <file> --project=chromium` or
   `npm run test:unit -- <file>`) and show the output. Fix until green. Never weaken an assertion
   just to make a test pass; if the app behaves differently from the spec, STOP and report it as
   a possible defect (the spec is the source of truth).
4. **Review.** Apply the `test-reviewer` skill to every changed file. Fix every FAIL and re-run.
5. **Lint and traceability** (once available): `npm run lint`, `npm run spec:check`.
6. **Check "Done when:"** — run the exact command of the task and confirm the expected result.
7. **Log.** Append an entry for this task to `specs/NNN-<feature>/implementation.md` using the
   "Task log entry" section of `implementation-template.md` (create the file from its header the
   first time).
8. **Close.** Tick the task in `tasks.md` and show the log entry in chat.
9. **STOP.** Do not start the next task. Ask: "Shall I continue with T<n+1>?"
   If this was the last task, set `Status: implemented` in spec.md and suggest
   `/validation-generator Validate spec NNN` instead.

Everything (code, comments, test titles, messages, log) is written in English.
