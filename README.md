# ecommerce-playwright-sdd

Test automation framework for an e-commerce web application, built with **Spec-Driven
Development (SDD)** and Claude Code skills. Playwright + TypeScript for API, integration and UI
tests; Vitest for unit tests; GitHub Actions for the branch gates and the automatic promotion.

## Test results
Live status of the latest run of each promotion branch (click a badge for its runs):

| Branch | CI status |
|---|---|
| `eyter_dev` | [![CI eyter_dev](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml/badge.svg?branch=eyter_dev)](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml?query=branch%3Aeyter_dev) |
| `release` | [![CI release](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml/badge.svg?branch=release)](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml?query=branch%3Arelease) |
| `main` | [![CI main](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml?query=branch%3Amain) |
| `production` | [![CI production](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml/badge.svg?branch=production)](https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd/actions/workflows/ci.yml?query=branch%3Aproduction) |

**Detailed results of all tests: [results page](https://eyter-higuera.github.io/ecommerce-playwright-claude-code-sdd/).**
For each branch it shows the commit, the workflow run, the date (UTC) and, per stage
(requirements coverage, unit tests with code coverage, API, UI per browser), the passed, failed,
skipped and flaky tests and the duration. Every push run updates it (Spec 000 RF-88). The same
tables are on the **Summary** page of each workflow run.

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
| Failure | `/fix-failure` | Why a test or pipeline run failed, the test-first fix, the green re-run and the `docs/bug-log.md` row |
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

Credentials go only in the local `.env` and, for CI, in GitHub encrypted secrets.
Process environment variables take precedence over `.env`.

## Commands
| Command | What it does |
|---|---|
| `npm run test:unit` | Vitest unit tests of the framework (no network, no variables needed) |
| `npm run test:unit:ci` | The same with code coverage (`reports/coverage/index.html`) and JSON results (`reports/unit-results.json`), as in CI |
| `npx playwright test --grep @smoke --project=api --project=chromium` | Sanity smoke tests against the demo site |
| `npx playwright test` | All Playwright tests on `api`, chromium, firefox and webkit |
| `npx playwright test --project=msedge` | UI tests on Microsoft Edge (local only, Edge must be installed) |
| `npm run lint` / `npm run typecheck` | ESLint rules and TypeScript strict check |
| `npm run spec:check` | SDD traceability gate; `npm run spec:check -- --write` regenerates `docs/traceability.md` |
| `npm run check:secrets` | Scans `reports/`, `playwright-report/` and `test-results/` for passwords and tokens |
| `npm run report:flaky` | Prints the number of flaky tests of the last run |
| `npm run report:summary -- --title <stage>` | Prints the passed / failed / skipped / flaky / duration table of the last Playwright run (`--report reports/unit-results.json --coverage reports/coverage/coverage-summary.json` for the unit run) |
| `npm run spec:check -- --summary` | Adds the requirements coverage per spec (RFs, test cases automated / manual / skipped / missing) |
| `npm run report:pages` | Builds the results page in `reports/pages/` (CI only: it needs the run's job results) |

Reports: HTML in `playwright-report/`, JUnit in `reports/junit.xml`, traces of first retries in
`test-results/`.

## Running tests manually

### Locally
Set up `.env` first (see [Setup](#setup)). Unit tests need no variables; API and UI tests run
against the real demo site.

| What | Command |
|---|---|
| Unit tests | `npm run test:unit` |
| Unit tests with code coverage | `npm run test:unit:ci`, then open `reports/coverage/index.html` |
| API tests (all) | `npx playwright test --project=api` |
| UI tests on one browser | `npx playwright test --project=chromium`, `npx playwright test --project=firefox` or `npx playwright test --project=webkit` |
| UI tests on all browsers | `npx playwright test --project=chromium --project=firefox --project=webkit` |
| Smoke suite (API + UI) | `npx playwright test --grep @smoke --project=api --project=chromium` (add `--project=firefox --project=webkit` for every browser) |
| Regression suite (API + UI) | `npx playwright test --grep @regression --project=api --project=chromium --project=firefox --project=webkit` |
| Smoke or regression on one layer | `npx playwright test --grep @smoke --project=api`, `npx playwright test --grep @regression --project=webkit`, … |
| The same selection as a manual CI run | `SUITE=regression BROWSER=all LAYER=all npm run ci:run-suite` (`SUITE`: smoke, regression · `BROWSER`: chromium, firefox, webkit, all · `LAYER`: all = unit then api and ui, unit, api, ui) |
| Results of the last run | `npx playwright show-report` (HTML) · `npm run report:summary -- --title Local` (table) |

The branch gates run the same commands in CI: `eyter_dev` and `production` run `@smoke` on `api`
then chromium; `main` runs `@smoke` and `release` runs `@regression` on `api`, then chromium,
firefox and webkit.

### In VS Code
The repository ships VS Code tasks (`.vscode/tasks.json`, Spec 000 RF-93, RF-98). They run the
tests **on your PC only**, show the results in the VS Code terminal and never start a pipeline in
GitHub. Open the Command Palette (`Ctrl+Shift+P`) → **Tasks: Run Task** and pick one; the task then
asks for its choices. VS Code also suggests the Playwright Test and Vitest extensions, which add a
test explorer.

| Task | Asks for | Runs |
|---|---|---|
| `Tests: run locally (layer, suite, browser)` | layer (all, unit, api, ui), suite (smoke, regression), browser (chromium, firefox, webkit, all) | `npm run test:local -- ci:run-suite` on the branch you have checked out, uncommitted changes included |
| `Tests: run locally on a branch (branch, layer, suite, browser)` | branch (eyter_dev, release, main, production), layer, suite, browser | `npm run test:local -- test:branch`: the checked-out branch in place; another branch in a local worktree (see below) |
| `Tests: unit tests` | — | `npm run test:unit:report` (writes `reports/unit-results.json`) |
| `Tests: unit tests with coverage` | — | `npm run test:unit:ci` (open `reports/coverage/index.html`) |
| `Tests: open Playwright report` | — | `npx playwright show-report` |
| `Tests: list last failures` | — | `npm run report:failures` |
| `Claude: analyze and fix last failure` | — | `claude "/fix-failure"` (see [When a test fails](#when-a-test-fails)) |

**After a run task finishes** (Spec 000 RF-100), passed or failed:
1. The HTML Playwright report of that run opens in your default browser (for another branch, the
   report of its worktree). A unit-only run (`layer` = unit) prints its summary table in the
   terminal instead. To see traces, use `Tests: open Playwright report`, which serves the report.
2. If tests failed, Claude Code starts in the same terminal with `/fix-failure` (`/fix-failure
   <branch>` for another branch): it explains the cause, fixes it and records it in the bug log.
   The report opens first because `/fix-failure` re-runs the failed tests and overwrites it.

This happens only in these two tasks: `npm run ci:run-suite` or `npm run test:branch` typed in a
terminal, CI runs and runs started by Claude Code itself open nothing.

**Testing another branch locally.** For `release`, `main` or `production` (when it is not the
branch you have checked out), `Tests: run locally on a branch` fetches the branch from GitHub and
tests it in a detached git worktree in
`%LOCALAPPDATA%\ecommerce-playwright-sdd\worktrees\<branch>` (`~/.cache/…` on Linux and macOS),
outside the repository and outside OneDrive. The first run copies your `.env` there and runs
`npm ci`; later runs move the worktree to the branch's latest commit and reinstall only when its
`package-lock.json` changed. No branch is created, changed, deleted or pushed. A failure found
there is fixed on `eyter_dev` (`/fix-failure <branch>`) and reaches the branch through promotion.
To free the disk space, remove a worktree by hand:
`git worktree remove "%LOCALAPPDATA%\ecommerce-playwright-sdd\worktrees\release"`.
Two runs on the same branch at the same time are not supported.

### In GitHub Actions, on any branch
This **does** start a pipeline in GitHub, so it is not a VS Code task: start it from the
Actions page or from a terminal. A manual run uses the code of the branch you pick. It runs the checks and the unit tests, then
`manual-api` and `manual-ui` as separate jobs, each only when the layer includes it (Spec 000
RF-80, RF-90). It never promotes and never updates the results page; its tables are on the run's
**Summary** page.

- **Web:** GitHub → Actions → CI → **Run workflow** → choose the branch, `suite` (smoke | regression),
  `browser` (chromium | firefox | webkit | all; the API tests always run once) and `layer`
  (all | unit | api | ui). Leave `chained` off: the regression chain sets it.
- **CLI** (a terminal with the GitHub CLI logged in to this repository), smoke on each branch:

| Branch | Everything | Unit only | API only | UI only |
|---|---|---|---|---|
| `eyter_dev` | `gh workflow run ci.yml --ref eyter_dev -f suite=smoke -f browser=chromium -f layer=all` | `gh workflow run ci.yml --ref eyter_dev -f suite=smoke -f browser=chromium -f layer=unit` | `gh workflow run ci.yml --ref eyter_dev -f suite=smoke -f browser=chromium -f layer=api` | `gh workflow run ci.yml --ref eyter_dev -f suite=smoke -f browser=all -f layer=ui` |
| `release` | `gh workflow run ci.yml --ref release -f suite=smoke -f browser=all -f layer=all` | `gh workflow run ci.yml --ref release -f suite=smoke -f browser=all -f layer=unit` | `gh workflow run ci.yml --ref release -f suite=smoke -f browser=all -f layer=api` | `gh workflow run ci.yml --ref release -f suite=smoke -f browser=firefox -f layer=ui` |
| `main` | `gh workflow run ci.yml --ref main -f suite=smoke -f browser=all -f layer=all` | `gh workflow run ci.yml --ref main -f suite=smoke -f browser=all -f layer=unit` | `gh workflow run ci.yml --ref main -f suite=smoke -f browser=all -f layer=api` | `gh workflow run ci.yml --ref main -f suite=smoke -f browser=webkit -f layer=ui` |
| `production` | `gh workflow run ci.yml --ref production -f suite=smoke -f browser=chromium -f layer=all` | `gh workflow run ci.yml --ref production -f suite=smoke -f browser=chromium -f layer=unit` | `gh workflow run ci.yml --ref production -f suite=smoke -f browser=chromium -f layer=api` | `gh workflow run ci.yml --ref production -f suite=smoke -f browser=chromium -f layer=ui` |

Then follow it with `gh run watch` and open its **Summary** page for the result tables.

### Regression: it starts from eyter_dev
A manual regression starts from `eyter_dev` (Spec 000 RF-91, RF-92). When every job of that run
passes, the last job (`chain-next`) starts the same run (same browser and layer) on the next
branch, so the regression continues on `release`, `main` and `production`, in order. Each branch
is tested on its own code at that moment; the chain never merges, pushes or promotes anything. A
failure stops the chain.

```bash
gh workflow run ci.yml --ref eyter_dev -f suite=regression -f browser=all -f layer=all
```

A regression started directly on `release`, `main` or `production` is refused at once with
"Regression starts from eyter_dev: run it there, it continues to release, main and production".

### Good to know
- **`CI=true` set locally** makes the run behave like CI: 2 retries and `test.only` forbidden.
  Unset it for normal local runs.
- **Local runs use at most 2 workers** (Spec 000 RF-99): with more, a full run on all browsers
  can run the PC out of memory and firefox or webkit crash. On a stronger PC, pass
  `--workers=<n>` on the command line; CI keeps Playwright's default.
- **Test account recovery (account A or B locked, or its password changed):** the shop is a
  shared public demo, so a third party can change an account. Symptoms:
  - The API smoke test fails with "Login API returned status <code> for the account in
    TEST_USER_EMAIL".
  - Every auth test that logs in fails at once: the form logins, the API logins and the
    logged-in session tests (their sessions fail with "API login for a test session failed").
  To recover:
  1. Register a new test account on the site, or reset the password.
  2. Update `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` (account A) or `TEST_USER_2_EMAIL` /
     `TEST_USER_2_PASSWORD` (account B) in `.env` and in the GitHub secrets
     (`gh secret set <NAME> -R Eyter-Higuera/ecommerce-playwright-claude-code-sdd`).

  To keep the accounts safe, a run sends at most one wrong password for account A and none for
  account B (Spec 001 RF-28; the unit test `wrong-password-limit.test.ts` enforces it).
- **Real secrets in the browser (Spec 001 RF-27):**
  - Test files that type a real password or hold the API token declare `test.use(NO_TRACE)` at
    file level. The `formAccountA`, `formAccountB` and `loggedInTest` fixtures refuse to run
    otherwise.
  - Real passwords go in through `LoginPage` (`enterSecret`), never with `fill` or
    `keyboard.type`. Playwright names those steps after the typed text, and the HTML report
    keeps the step titles even without a trace.
- **Windows with Volta:** `npx` passes through `cmd.exe`, so a Vitest `-t` or Playwright `--grep`
  pattern that contains `|` breaks. Run the CLI with the real Node binary instead:
  `node node_modules/vitest/vitest.mjs run <file> -t "<pattern>"` or
  `node node_modules/@playwright/test/cli.js test --grep "<pattern>"`.

## When a test fails
Claude Code explains the failure, fixes it and records it in one step (Spec 000 RF-96, RF-97):

1. Run the VS Code task **`Claude: analyze and fix last failure`**, or type `/fix-failure` in
   Claude Code. For a branch tested with `Tests: run locally on a branch`, type
   `/fix-failure <branch>`; for a red GitHub run, type `/fix-failure <run-id>` (the id is in the run's URL).
2. Claude Code runs `npm run report:failures` (or `npm run report:failures -- --run <run-id>`),
   which lists each failed test with its error, trace and screenshot, or each failed job with the
   end of its log, with passwords and tokens redacted.
3. It tells you the cause: a test bug, a framework bug, the demo site down, a real defect of the
   shop, or a behavior change that needs a spec change.
4. It fixes test bugs and framework bugs test-first, re-runs the failed tests and shows them green.
   A behavior change is proposed as a spec change instead; a site outage or a shop defect is only
   recorded.
5. It adds the row to [docs/bug-log.md](docs/bug-log.md) and stops. It never commits or pushes:
   you decide when.

To only see what failed, run the task **`Tests: list last failures`** (`npm run report:failures`).

## Bug log
Every test or pipeline failure found and fixed is recorded in [docs/bug-log.md](docs/bug-log.md),
one row each (Spec 000 RF-95): the date it was found, what failed, the marks ❌ (failed) and ✅
(passed again after the fix), the cause (why and where it failed) and the solution (the fix and the
re-run that proved it).

## CI/CD (GitHub Actions)
The repository lives on GitHub (`origin`: https://github.com/Eyter-Higuera/ecommerce-playwright-claude-code-sdd)
and `.github/workflows/ci.yml` is its only CI (Spec 000 RF-58 to RF-89). Every push to a
promotion branch runs each stage as a separate job, and a job starts only after the previous one
passed (RF-83):

| Branch | Jobs, in order | On success |
|---|---|---|
| `eyter_dev` | `checks` → `unit-tests` → `eyter-dev-api` (@smoke) → `eyter-dev-ui-chromium` | merged into `release` |
| `release` | `checks` → `unit-tests` → `release-api` (@regression) → `release-ui-chromium` → `release-ui-firefox` → `release-ui-webkit` | merged into `main` |
| `main` | `checks` → `unit-tests` → `main-api` (@smoke) → `main-ui-chromium` → `main-ui-firefox` → `main-ui-webkit` | merged into `production` |
| `production` | `checks` → `unit-tests` → `production-api` (@smoke) → `production-ui-chromium` | — (last branch) |

`checks` runs spec:check, lint and typecheck in parallel; a failing check cancels the other two.

- **A failed or canceled job stops everything after it.** The later jobs are skipped and the run
  does not promote.
- **Summaries (RF-84 to RF-87).** Every test job adds a table to the run's **Summary** page:
  passed, failed, skipped and flaky tests, the total, the duration and the failed titles. The unit
  job adds its code coverage (lines, branches, functions, statements; reported, never a gate), and
  the spec:check job adds the requirements coverage per spec.
- **Results page (RF-88).** After the test jobs of a push run, `publish-results` updates the
  [results page](https://eyter-higuera.github.io/ecommerce-playwright-claude-code-sdd/) with this
  branch's latest results and keeps the other branches'. It is the only job allowed to write to
  GitHub Pages, and the page passes `check:secrets` before it is deployed.
- **Promotion is automatic.** The last job (`promote`, `npm run ci:promote`) starts only when no
  other job of the run failed or was canceled. It merges exactly the tested commit into the next
  branch through the GitHub merges API. That merge starts the next branch's run, and so on up to
  `production`.
- **A failed or canceled job stops the chain.** If a newer commit reached the source branch in the
  meantime, the promotion fails, and that commit is promoted by its own run instead.
- **Reports.** Each test job runs `check:secrets` whether it passed or failed. It uploads
  `playwright-report/`, `reports/` (JUnit and coverage included) and `test-results/` for 7 days
  only when that scan passes.
- **Manual run.** See [In GitHub Actions, on any branch](#in-github-actions-on-any-branch). It never
  promotes and never publishes.

One-time setup, done by a maintainer and never committed. These are the repository secrets
(Settings → Secrets and variables → Actions):
- `BASE_URL`, `API_BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_USER_2_EMAIL`
  and `TEST_USER_2_PASSWORD`. For example:
  `gh secret set -f .env -R Eyter-Higuera/ecommerce-playwright-claude-code-sdd`.
- `PROMOTION_TOKEN`: a fine-grained personal access token for this repository only, with
  *Contents: read and write*. It is needed because merges made with the default `GITHUB_TOKEN` do
  not start the next branch's run.
- **GitHub Pages for the results page.** The repository must be public (Pages is not available for
  private repositories on the free plan). Before making it public, scan the whole git history for
  secrets (Spec 000 TC-000-136). Then set Settings → Pages → Source: **GitHub Actions**, and in
  Settings → Environments → `github-pages` allow the branches `eyter_dev`, `release`, `main` and
  `production`. Without this setup, `publish-results` fails and the run does not promote.

Push changes with `git push origin eyter_dev` only. `release`, `main` and `production` are
updated by the promotion, never by hand. Never force-push and never delete a branch.
