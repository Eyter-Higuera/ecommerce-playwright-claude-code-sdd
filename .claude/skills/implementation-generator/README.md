# implementation-generator

SDD phase: **Implementation**. Implements exactly ONE task of `tasks.md`: tests first, then the
supporting Page Objects, API clients, schemas, fixtures and data factories. Runs the tests,
applies the test review checklist, logs the result and stops.

## Files
| File | Purpose |
|------|---------|
| `SKILL.md` | Instructions Claude follows (preconditions, steps, quality gates, stop rule) |
| `implementation-template.md` | Part 1: log template → `specs/NNN-<feature>/implementation.md` (one entry per task). Part 2: code skeletons (UI test, Page Object, API test, unit test, data factory) |

## When to use
After `tasks.md` is approved, once per task, in order.

```
/implementation-generator Implement ONLY task T1 of spec 004.
```

## Preconditions
- Runs only when you type `/implementation-generator`.
- `spec.md` is `test-cases-approved` (or later); `plan.md` and `tasks.md` are `approved`.
- The tasks this one depends on are ticked.

## What it guarantees before ticking the task
- Tests written first; titles start with the TC ID; tags from the test case.
- AAA with blank lines, `describe()` by scenario type, comments explaining what and why.
- Locator priority, no `waitForTimeout`, no magic values, TEST_ data, no real HTTP in unit tests.
- The task's "Done when:" command passes.
- `test-reviewer` verdict is PASS (and lint / spec:check once available).
- If the application behaves differently from the spec, it stops and reports a possible defect
  instead of weakening the test.

## Status changes
- Ticks `T<n>` in `tasks.md` and appends its entry to `implementation.md`.
- After the last task: `spec.md` → `implemented`.

## Next step
`/implementation-generator Implement ONLY task T<n+1> of spec NNN.`, or after the last task
`/validation-generator Validate spec NNN.`
