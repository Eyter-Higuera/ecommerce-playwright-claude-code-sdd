# validation-generator

SDD phase: **Validation**. Checks an implemented spec requirement by requirement: which test
cases and automated tests cover each RF, their results, lint, spec:check, the test review
checklist and the done criteria. Writes a report and gives a verdict.

## Files
| File | Purpose |
|------|---------|
| `SKILL.md` | Instructions Claude follows (preconditions, steps, verdict, next spec proposal) |
| `validation-template.md` | Report template → `specs/NNN-<feature>/validation.md` |

## When to use
After the last task of the spec is done.

```
/validation-generator Validate spec 004 requirement by requirement and give me a verdict.
```

## Preconditions
- Runs only when you type `/validation-generator`.
- Every task in `tasks.md` is ticked and `spec.md` has `Status: implemented`.

## What it checks
- Every RF has test cases, and every `Automate: Y` test case has a passing test.
- Lint, `spec:check` and the test review checklist all PASS.
- Every item of the spec's "Done criteria".
- No open `[NEEDS CLARIFICATION]` items.
Failures are reported clearly and never softened. It does not fix anything unless you ask.

## Status changes
`spec.md`: `implemented` → (verdict fulfilled + you confirm) `validated`

## Next step
It proposes the next spec from the roadmap and waits. It never creates it; you start it with
`/spec-generator`.
