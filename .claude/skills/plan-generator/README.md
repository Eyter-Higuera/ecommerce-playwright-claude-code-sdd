# plan-generator

SDD phase: **Plan**. Explains HOW the approved requirements and test cases will be automated:
Page Objects, API clients, schemas, fixtures, test data, mocking and locator strategy, and
justified technical decisions. Never writes code.

## Files
| File | Purpose |
|------|---------|
| `SKILL.md` | Instructions Claude follows (preconditions, rules, self-check, approval gate) |
| `plan-template.md` | Plan template → `specs/NNN-<feature>/plan.md` |

## When to use
After the spec's test cases are approved.

```
/plan-generator Create the plan for spec 004.
```

## Preconditions
- Runs only when you type `/plan-generator`.
- `spec.md` has `Status: test-cases-approved` and `test-cases.md` has `Status: approved`.
- If `plan.md` already exists, it asks whether to overwrite, update or cancel.

## What it validates before asking for approval
- Every RF appears in the coverage map.
- Every test case with `Automate: Y` is mapped to a layer and a test file.
- The constitution check has no violations (or they are flagged for your decision).
- Any new dependency is flagged for approval.
- Existing Page Objects, API clients and fixtures are reused (marked NEW or REUSED).

## Status changes
`plan.md`: `draft` → (you approve) `approved`

## Next step
`/tasks-generator Create the tasks for spec NNN.`
