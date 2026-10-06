---
name: plan-generator
description: Generates the technical plan (plan.md) for an SDD spec whose test cases are approved - page objects, API clients, fixtures, data, mocking and locator strategy, justified decisions - mapping every RF and test case. Run only when the user invokes /plan-generator.
disable-model-invocation: true
---

# Plan Generator

## Preconditions (STOP if any fails and name the missing step)
- The user explicitly asked for the plan of a specific spec.
- `specs/NNN-<feature>/spec.md` has `Status: test-cases-approved`.
- `specs/NNN-<feature>/test-cases.md` has `Status: approved`.
- If `plan.md` already exists, ask: "plan.md already exists. Overwrite it or update it? (overwrite/update/cancel)".

## Read first
`docs/constitution.md`, `docs/test-plan.md`, `docs/test-review-checklist.md`, the spec's
`spec.md` and `test-cases.md`, and the existing `src/` and `tests/` folders (reuse existing Page
Objects, API clients, fixtures and factories instead of proposing new ones).

## Rules
- Do NOT write code. Short signatures or locator examples inside the plan are allowed.
- HOW, not WHAT: the plan explains how the approved RFs and TCs will be automated.
- Respect the constitution: no new dependency without asking; Page Objects / API clients hold
  the details; locator priority; no hard waits; TEST_ data with cleanup; unit tests fully mocked.
- Everything is written in English.

## Steps
1. Write `specs/NNN-<feature>/plan.md` using `plan-template.md` in this skill folder, with `Status: draft`.
2. Fill every section. In particular:
   - **Coverage map**: every RF and every TC with `Automate: Y`, its layer and target test file.
   - **Page Objects / API clients**: mark each as NEW or REUSED (with file path).
   - **Technical decisions**: each with its reason and the discarded alternative.
   - Mark which RF/TC each section covers, e.g. `(covers RF-2, TC-NNN-04)`.
   - Mark unknown UI details as `// TODO: VERIFY` (e.g. a role or label not yet confirmed).
3. **Self-check gate** (fix before showing):
   - [ ] Every RF appears in the coverage map
   - [ ] Every `Automate: Y` TC is mapped to a layer and test file
   - [ ] Constitution check has no ✘ (or the ✘ is explained and needs user approval)
   - [ ] No new dependency without being flagged for approval
4. Show a short summary (files to create/reuse, decisions, risks) and ask:
   "Do you approve the plan for spec NNN?"
5. On an explicit yes, set `Status: approved` in plan.md. Next step: `/tasks-generator`. STOP.
