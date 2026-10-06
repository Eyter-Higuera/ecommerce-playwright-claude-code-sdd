---
name: validation-generator
description: Validates an implemented SDD spec requirement by requirement - which test cases and automated tests cover each RF, their execution results, quality gates and done criteria - writes the validation.md report and gives a final verdict. Run only when the user invokes /validation-generator.
disable-model-invocation: true
---

# Validation Generator

## Preconditions (STOP if any fails)
- The user explicitly asked to validate a specific spec.
- All tasks in `specs/NNN-<feature>/tasks.md` are ticked and the spec has `Status: implemented`.
  If not, list the pending tasks and STOP.

## Steps
1. Read `docs/constitution.md`, and the spec's `spec.md`, `test-cases.md`, `plan.md`, `tasks.md` and `implementation.md` (assumptions and possible defects logged per task).
2. Run the spec's tests and keep the output:
   - Playwright: `npx playwright test --grep "TC-NNN-"` (chromium, plus the browsers the TCs require)
   - Unit: `npm run test:unit`
3. Run `npm run lint` and `npm run spec:check` (once available).
4. For EACH RF, record:
   - Test cases that cover it
   - Automated test file and title for each TC (or the reason it is manual)
   - Result: PASS / FAIL / SKIPPED / MANUAL
5. Apply the `test-reviewer` skill to the spec's test files and record its verdict.
6. Check every item of the spec's "Done criteria" section.
7. Clearly flag: RFs without coverage, failing tests, TCs marked `Automate: Y` without a test,
   open `[NEEDS CLARIFICATION]` items. Never hide or soften a failure.
8. Write the report to `specs/NNN-<feature>/validation.md` using `validation-template.md` in this skill folder
   (overwrite the previous report if one exists) and show its summary and verdict in chat.

## After the verdict
- **Fulfilled**: ask "Do you confirm spec NNN as validated? (yes/no)". On an explicit yes, set
  `Status: validated` in spec.md and propose the next spec from the roadmap:
  "Spec NNN is validated. Shall I start Spec NNN+1 — <name>?"
  Do NOT create the next spec; wait for the user to invoke `/spec-generator`.
- **Not fulfilled**: list what is missing and STOP. Do not fix anything unless asked.

Everything is written in English.
