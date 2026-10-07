# ecommerce-playwright-sdd

Test automation framework for an e-commerce web application, built with **Spec-Driven
Development (SDD)** and Claude Code skills. Playwright + TypeScript for API, integration and UI
tests; Vitest for unit tests; GitLab CI/CD for the promotion pipeline.

## SDD flow
Constitution → Spec → Clarification → Test cases → Plan → Tasks → Implementation (one task at a
time, tests first) → Validation → Change (spec first, then code).

Only one spec is active at a time. Claude Code never creates a new spec unless you request it.

## Project structure
```
├── AGENTS.md / CLAUDE.md        # agent context (CLAUDE.md → @AGENTS.md)
├── docs/                        # constitution, test plan, review checklist, traceability
├── samples/                     # AGENTS.md template and prompts per phase
├── specs/NNN-<feature>/         # spec.md, test-cases.md, plan.md, tasks.md, implementation.md, validation.md
├── .claude/skills/              # one skill per SDD phase (see below)
│   └── <name>-generator/        # SKILL.md + README.md + <name>-template.md (the template for its output)
├── src/                         # page objects, API clients, schemas, fixtures, data factories, config
└── tests/                       # unit, api, ui, integration, mocked
```

## Skills
| Phase | Skill | Output |
|---|---|---|
| Spec + test cases | `/spec-generator` | `spec.md` from a pasted user story or an interview; `test-cases.md` with the recommended test cases |
| Clarification | `/spec-reviewer` | QA review report (ambiguities, contradictions, edge cases, constitution conflicts) |
| Plan | `/plan-generator` | `plan.md` |
| Tasks | `/tasks-generator` | `tasks.md` |
| Implementation | `/implementation-generator` | Code and tests for ONE task + entry in `implementation.md`, then stop |
| Review | `/test-reviewer` | PASS/FAIL report against `docs/test-review-checklist.md` |
| Validation | `/validation-generator` | `validation.md` + verdict; proposes (never creates) the next spec |

Every generator stops at an approval gate and only moves forward on an explicit "yes".
Status flow of a spec: `draft → approved → test-cases-approved → implemented → validated`.

Prompts for every phase: [samples/prompts.md](samples/prompts.md).

## Setup
Commands (install, test, lint) are added in Spec 000 — framework-foundation.
Credentials go in a local `.env` (never committed) and in masked, protected GitLab CI/CD variables for CI.
