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
Requirements: Node 20 or later (in practice 20.19+, the minimum of ESLint 10 and Vite) and npm.

```bash
npm ci                  # installs dependencies and the chromium, firefox and webkit browsers
cp .env.example .env    # then fill in the TEST_USER_* values (never commit .env)
```

Credentials go only in the local `.env` and, for CI, in masked, protected GitLab CI/CD variables.
Process environment variables take precedence over `.env`.

## Commands
| Command | What it does |
|---|---|
| `npm run test:unit` | Vitest unit tests of the framework (no network, no variables needed) |
| `npx playwright test --grep @smoke --project=api --project=chromium` | Sanity smoke tests against the demo site |
| `npx playwright test` | All Playwright tests on `api`, chromium, firefox and webkit |
| `npx playwright test --project=msedge` | UI tests on Microsoft Edge (local only, Edge must be installed) |
| `npm run lint` / `npm run typecheck` | ESLint rules and TypeScript strict check |
| `npm run spec:check` | SDD traceability gate; `npm run spec:check -- --write` regenerates `docs/traceability.md` |
| `npm run check:secrets` | Scans `reports/`, `playwright-report/` and `test-results/` for passwords and tokens |
| `npm run report:flaky` | Prints the number of flaky tests of the last run |

Reports: HTML in `playwright-report/`, JUnit in `reports/junit.xml`, traces of first retries in
`test-results/`.

### Good to know
- **`CI=true` set locally** makes the run behave like CI: 2 retries and `test.only` forbidden.
  Unset it for normal local runs.
- **Test account A locked or its password changed:** the shop is a shared public demo, so a
  third party can change the account. The API smoke test then fails with "Login API returned
  status <code> for the account in TEST_USER_EMAIL". To recover:
  1. Register a new test account on the site, or reset the password.
  2. Update `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` in `.env` and in the GitLab CI/CD
     variables (masked and protected).
- **Windows with Volta:** `npx` passes through `cmd.exe`, so a Vitest `-t` pattern that contains
  `|` breaks. Run `node node_modules/vitest/vitest.mjs run <file> -t "<pattern>"` with the real
  Node binary instead.

## CI/CD (GitLab)
Every push to a promotion branch runs spec:check, lint, typecheck and the unit tests, then the
branch's Playwright gate, then `check:secrets` on each Playwright job's artifacts:

| Branch | Playwright gate | On success |
|---|---|---|
| `eyter_dev` | smoke on api and chromium | merged into `release` |
| `release` | regression on api, chromium, firefox and webkit | merged into `main` |
| `main` | smoke on api, chromium, firefox and webkit | merged into `production` |
| `production` | smoke on api and chromium | — (last branch) |

Promotion is automatic: the last stage (`promote`, `npm run ci:promote`) starts only when every
other job of the pipeline passed. It opens (or reuses) the merge request to the next branch and
merges exactly the tested commit, keeping the source branch. A failed or canceled job stops the
chain, and if a newer commit reached the source branch meanwhile, the promotion fails and that
commit is promoted by its own pipeline instead.

A manual "Run pipeline" takes `SUITE` (`smoke` | `regression`) and `BROWSER`
(`chromium` | `firefox` | `webkit` | `all`) and never promotes. Reports are kept 7 days; JUnit
appears in the pipeline's Tests tab.

One-time GitLab setup for promotion (done by a maintainer, never committed):
1. Protect `eyter_dev`, `release`, `main` and `production` (Settings → Repository → Protected
   branches), with Maintainers allowed to merge.
2. Create a Project Access Token (Settings → Access tokens) with role Maintainer and scope `api`.
3. Store it as the CI/CD variable `PROMOTION_TOKEN`, masked and protected.
