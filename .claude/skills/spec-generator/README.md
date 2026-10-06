# spec-generator

SDD phases: **Spec** and **Test cases** (also **Change** to an existing spec).
Turns requirements into a spec with EARS acceptance criteria, and an approved spec into the
recommended test cases. Never writes code.

## Files
| File | Purpose |
|------|---------|
| `SKILL.md` | Instructions Claude follows (creation gate, modes, validation gates) |
| `spec-template.md` | Spec template → `specs/NNN-<feature>/spec.md` |
| `test-cases-template.md` | Test case template → `specs/NNN-<feature>/test-cases.md` |

## When to use
| Mode | Use it when | Example prompt |
|------|-------------|----------------|
| A — Pasted requirements | You have a user story and acceptance criteria (copied by hand from Jira; no Jira connection) | `/spec-generator Create a spec from this user story: <paste>` |
| A' — Interview | You only have an idea | `/spec-generator Create a new spec for the cart. Interview me first.` |
| B — Recommended test cases | The spec is `approved` | `/spec-generator Create the recommended test cases for spec 004.` |
| C — Change | A requirement changes or is added | `/spec-generator New requirement for spec 004: <change>. Show me the diff.` |

## Preconditions
- Runs only when you type `/spec-generator` (`disable-model-invocation: true`).
- No other spec can be active: every other spec must be `validated`.
- A new spec is created only after you answer "yes" to the proposed ID and title.

## What it validates
- **Input (Mode A):** user story, at least one acceptance criterion and a feature name; otherwise it lists what is missing and stops.
- **Security (Mode A):** redacts credentials, tokens and real personal data from the pasted text.
- **Output (Mode B):** every RF has a positive and a negative test case, all fields filled, smoke set is P1 only, TEST_ data only.

## Status changes
`draft` → (you approve the spec) `approved` → (you approve the test cases) `test-cases-approved`

## Next step
`/spec-reviewer` (clarification) after the spec, `/plan-generator` after the test cases.
