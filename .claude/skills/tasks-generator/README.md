# tasks-generator

SDD phase: **Tasks**. Breaks the approved plan into small tasks (20-30 minutes max) in
dependency order, each with the RF / test cases it covers and a verifiable "Done when:" line.
Never writes code.

## Files
| File | Purpose |
|------|---------|
| `SKILL.md` | Instructions Claude follows (preconditions, rules, self-check, approval gate) |
| `tasks-template.md` | Tasks template → `specs/NNN-<feature>/tasks.md` |

## When to use
After the plan is approved.

```
/tasks-generator Create the tasks for spec 004.
```

## Preconditions
- Runs only when you type `/tasks-generator`.
- `plan.md` has `Status: approved`.
- If `tasks.md` already exists, it asks whether to overwrite, update or cancel, and never unticks a finished task.

## What it validates before asking for approval
- Every test case with `Automate: Y` belongs to exactly one task.
- Every RF is covered by at least one task.
- No task depends on a later task.
- Every "Done when:" is a command plus an expected result (no "works correctly").

## Status changes
`tasks.md`: `draft` → (you approve) `approved`

## Next step
`/implementation-generator Implement ONLY task T1 of spec NNN.` — one task at a time.
