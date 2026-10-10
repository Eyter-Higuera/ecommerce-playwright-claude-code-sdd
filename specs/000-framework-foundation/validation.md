# Validation — Spec 000 Framework foundation

Date: 2026-10-08 · Branch: eyter_dev · Commit: 626998f
Spec: specs/000-framework-foundation/spec.md

Results below come from the validation run on commit 626998f. Automated results: Vitest JSON
report and Playwright output. Manual results: executed during validation, or CI pipeline evidence.

## Requirement coverage
63 RFs PASS · 4 RFs PARTIAL (all automated tests pass; one manual TC not run) · 0 FAIL · 0 uncovered.

| RF | Test cases | Tests (file › title) | Result |
|----|------------|----------------------|--------|
| RF-1 | TC-000-01, TC-000-02 | TC-000-01: manual (PASS)<br>TC-000-02: manual (PASS) | PASS |
| RF-2 | TC-000-04, TC-000-05 | tests/unit/ci/gitlab-ci.test.ts › TC-000-04<br>tests/unit/ci/playwright-image-version.test.ts › TC-000-05 | PASS |
| RF-3 | TC-000-02, TC-000-03 | TC-000-02: manual (PASS)<br>tests/unit/setup/manifest.test.ts › TC-000-03 | PASS |
| RF-4 | TC-000-06, TC-000-07 | tests/unit/setup/typecheck.test.ts › TC-000-06<br>tests/unit/setup/typecheck.test.ts › TC-000-07 | PASS |
| RF-5 | TC-000-08, TC-000-09 | tests/unit/setup/vitest-runner.test.ts › TC-000-08<br>tests/unit/setup/vitest-runner.test.ts › TC-000-09 | PASS |
| RF-6 | TC-000-10, TC-000-11 | tests/unit/setup/network-guard.test.ts › TC-000-10<br>tests/unit/setup/network-guard.test.ts › TC-000-11 | PASS |
| RF-7 | TC-000-12, TC-000-13 | tests/unit/setup/vitest-runner.test.ts › TC-000-12<br>tests/unit/config/env.test.ts › TC-000-13 | PASS |
| RF-8 | TC-000-14, TC-000-15 | tests/unit/playwright/projects.test.ts › TC-000-14<br>tests/unit/playwright/projects.test.ts › TC-000-15 | PASS |
| RF-9 | TC-000-16, TC-000-17 | tests/unit/playwright/projects.test.ts › TC-000-16<br>tests/unit/playwright/projects.test.ts › TC-000-17 | PASS |
| RF-10 | TC-000-17, TC-000-18 | tests/unit/playwright/projects.test.ts › TC-000-17<br>tests/unit/playwright/projects.test.ts › TC-000-18 | PASS |
| RF-11 | TC-000-14, TC-000-19 | tests/unit/playwright/projects.test.ts › TC-000-14<br>tests/unit/playwright/projects.test.ts › TC-000-19 | PASS |
| RF-12 | TC-000-20, TC-000-21 | tests/unit/playwright/projects.test.ts › TC-000-20<br>tests/unit/playwright/projects.test.ts › TC-000-21 | PASS |
| RF-13 | TC-000-22, TC-000-28 | tests/unit/config/env.test.ts › TC-000-22<br>tests/unit/config/credential-isolation.test.ts › TC-000-28 | PASS |
| RF-14 | TC-000-12, TC-000-23 | tests/unit/setup/vitest-runner.test.ts › TC-000-12<br>tests/unit/config/env.test.ts › TC-000-23 | PASS |
| RF-15 | TC-000-24, TC-000-25 | tests/unit/config/env.test.ts › TC-000-24<br>tests/unit/config/env.test.ts › TC-000-25 | PASS |
| RF-16 | TC-000-26, TC-000-27 | tests/unit/config/base-url-validation.test.ts › TC-000-26<br>tests/unit/config/base-url-validation.test.ts › TC-000-27 | PASS |
| RF-17 | TC-000-22, TC-000-28 | tests/unit/config/env.test.ts › TC-000-22<br>tests/unit/config/credential-isolation.test.ts › TC-000-28 | PASS |
| RF-18 | TC-000-29, TC-000-30 | tests/unit/config/env-example.test.ts › TC-000-29<br>tests/unit/config/env-example.test.ts › TC-000-30 | PASS |
| RF-19 | TC-000-31, TC-000-32 | tests/unit/config/env-example.test.ts › TC-000-31<br>tests/unit/config/env-example.test.ts › TC-000-32 | PASS |
| RF-20 | TC-000-33, TC-000-34 | tests/unit/security/redaction.test.ts › TC-000-33<br>tests/unit/security/redaction.test.ts › TC-000-34 | PASS |
| RF-21 | TC-000-35, TC-000-36 | tests/unit/security/redaction.test.ts › TC-000-35<br>TC-000-36: manual (PASS) | PASS |
| RF-22 | TC-000-36, TC-000-37 | TC-000-36: manual (PASS)<br>TC-000-37: manual (PASS) | PASS |
| RF-23 | TC-000-38, TC-000-39 | tests/unit/security/check-secrets.test.ts › TC-000-38<br>tests/unit/security/check-secrets.test.ts › TC-000-39 | PASS |
| RF-24 | TC-000-38, TC-000-39 | tests/unit/security/check-secrets.test.ts › TC-000-38<br>tests/unit/security/check-secrets.test.ts › TC-000-39 | PASS |
| RF-25 | TC-000-40, TC-000-41 | tests/unit/reporting/tracing.test.ts › TC-000-40<br>tests/unit/reporting/tracing.test.ts › TC-000-41 | PASS |
| RF-26 | TC-000-36, TC-000-37 | TC-000-36: manual (PASS)<br>TC-000-37: manual (PASS) | PASS |
| RF-27 | TC-000-42, TC-000-43 | tests/unit/lint/eslint-rules.test.ts › TC-000-42<br>tests/unit/lint/eslint-rules.test.ts › TC-000-43 | PASS |
| RF-28 | TC-000-44, TC-000-45 | tests/unit/lint/eslint-rules.test.ts › TC-000-44<br>tests/unit/lint/eslint-rules.test.ts › TC-000-45 | PASS |
| RF-29 | TC-000-46, TC-000-47 | tests/unit/lint/eslint-rules.test.ts › TC-000-46<br>tests/unit/lint/eslint-rules.test.ts › TC-000-47 | PASS |
| RF-30 | TC-000-48, TC-000-49 | tests/unit/lint/eslint-rules.test.ts › TC-000-48<br>tests/unit/lint/eslint-rules.test.ts › TC-000-49 | PASS |
| RF-31 | TC-000-50, TC-000-51 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-51 | PASS |
| RF-32 | TC-000-50, TC-000-52 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-52 | PASS |
| RF-33 | TC-000-50, TC-000-53, TC-000-54 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-53<br>tests/unit/spec-check/spec-check.test.ts › TC-000-54 | PASS |
| RF-34 | TC-000-50, TC-000-55 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-55 | PASS |
| RF-35 | TC-000-50, TC-000-56 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-56 | PASS |
| RF-36 | TC-000-50, TC-000-57 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-57 | PASS |
| RF-37 | TC-000-54, TC-000-58 | tests/unit/spec-check/spec-check.test.ts › TC-000-54<br>tests/unit/spec-check/spec-check-write.test.ts › TC-000-58 | PASS |
| RF-38 | TC-000-61, TC-000-62 | tests/unit/spec-check/spec-check.test.ts › TC-000-61<br>tests/unit/spec-check/spec-check.test.ts › TC-000-62 | PASS |
| RF-39 | TC-000-50, TC-000-63, TC-000-64 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-63<br>tests/unit/spec-check/spec-check.test.ts › TC-000-64 | PASS |
| RF-40 | TC-000-50, TC-000-51 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-51 | PASS |
| RF-41 | TC-000-50, TC-000-65 | tests/unit/spec-check/spec-check.test.ts › TC-000-50<br>tests/unit/spec-check/spec-check.test.ts › TC-000-65 | PASS |
| RF-42 | TC-000-58, TC-000-59 | tests/unit/spec-check/spec-check-write.test.ts › TC-000-58<br>tests/unit/spec-check/spec-check-write.test.ts › TC-000-59 | PASS |
| RF-43 | TC-000-58, TC-000-60 | tests/unit/spec-check/spec-check-write.test.ts › TC-000-58<br>tests/unit/spec-check/spec-check-write.test.ts › TC-000-60 | PASS |
| RF-44 | TC-000-66, TC-000-67 | tests/unit/data/test-data-factory.test.ts › TC-000-66<br>tests/unit/data/test-data-factory.test.ts › TC-000-67 | PASS |
| RF-45 | TC-000-67, TC-000-68 | tests/unit/data/test-data-factory.test.ts › TC-000-67<br>tests/unit/data/test-data-factory.test.ts › TC-000-68 | PASS |
| RF-46 | TC-000-69, TC-000-70 | tests/unit/reporting/reporters.test.ts › TC-000-69<br>tests/unit/reporting/reporters.test.ts › TC-000-70 | PASS |
| RF-47 | TC-000-71, TC-000-72 | tests/unit/reporting/reporters.test.ts › TC-000-71<br>tests/unit/reporting/reporters.test.ts › TC-000-72 | PASS |
| RF-48 | TC-000-71, TC-000-72 | tests/unit/reporting/reporters.test.ts › TC-000-71<br>tests/unit/reporting/reporters.test.ts › TC-000-72 | PASS |
| RF-49 | TC-000-40, TC-000-41 | tests/unit/reporting/tracing.test.ts › TC-000-40<br>tests/unit/reporting/tracing.test.ts › TC-000-41 | PASS |
| RF-50 | TC-000-73, TC-000-74 | tests/unit/reporting/flaky.test.ts › TC-000-73<br>tests/unit/reporting/flaky.test.ts › TC-000-74 | PASS |
| RF-51 | TC-000-74, TC-000-75 | tests/unit/reporting/flaky.test.ts › TC-000-74<br>tests/unit/reporting/flaky.test.ts › TC-000-75 | PASS |
| RF-52 | TC-000-76, TC-000-77, TC-000-78 | tests/ui/login-page.spec.ts › TC-000-76 (3 runs)<br>tests/unit/smoke/login-url.test.ts › TC-000-77<br>tests/mocked/login-page-unavailable.spec.ts › TC-000-78 (3 runs) | PASS |
| RF-53 | TC-000-76, TC-000-78, TC-000-79 | tests/ui/login-page.spec.ts › TC-000-76 (3 runs)<br>tests/mocked/login-page-unavailable.spec.ts › TC-000-78 (3 runs)<br>tests/mocked/login-page-unavailable.spec.ts › TC-000-79 (3 runs) | PASS |
| RF-54 | TC-000-80, TC-000-81 | tests/api/auth-login.spec.ts › TC-000-80<br>tests/unit/smoke/login-response.test.ts › TC-000-81 | PASS |
| RF-55 | TC-000-80, TC-000-81 | tests/api/auth-login.spec.ts › TC-000-80<br>tests/unit/smoke/login-response.test.ts › TC-000-81 | PASS |
| RF-56 | TC-000-80, TC-000-82, TC-000-83 | tests/api/auth-login.spec.ts › TC-000-80<br>tests/unit/smoke/login-response.test.ts › TC-000-82<br>tests/unit/smoke/login-response.test.ts › TC-000-83 | PASS |
| RF-57 | TC-000-80, TC-000-84, TC-000-85 | tests/api/auth-login.spec.ts › TC-000-80<br>tests/unit/smoke/login-response.test.ts › TC-000-84<br>tests/unit/smoke/login-response.test.ts › TC-000-85 | PASS |
| RF-58 | TC-000-86, TC-000-87 | tests/unit/ci/gitlab-ci.test.ts › TC-000-86<br>tests/unit/ci/gitlab-ci.test.ts › TC-000-87 | PASS |
| RF-59 | TC-000-88, TC-000-89 | TC-000-88: manual (PASS)<br>TC-000-89: manual (NOT RUN) | PARTIAL (a manual TC is NOT RUN) |
| RF-60 | TC-000-90, TC-000-91 | tests/unit/ci/ci-run-suite.test.ts › TC-000-90<br>tests/unit/ci/ci-run-suite.test.ts › TC-000-91 | PASS |
| RF-61 | TC-000-90, TC-000-91 | tests/unit/ci/ci-run-suite.test.ts › TC-000-90<br>tests/unit/ci/ci-run-suite.test.ts › TC-000-91 | PASS |
| RF-62 | TC-000-90, TC-000-91 | tests/unit/ci/ci-run-suite.test.ts › TC-000-90<br>tests/unit/ci/ci-run-suite.test.ts › TC-000-91 | PASS |
| RF-63 | TC-000-90, TC-000-92 | tests/unit/ci/ci-run-suite.test.ts › TC-000-90<br>tests/unit/ci/ci-run-suite.test.ts › TC-000-92 | PASS |
| RF-64 | TC-000-93, TC-000-94 | TC-000-93: manual (PASS)<br>TC-000-94: manual (NOT RUN) | PARTIAL (a manual TC is NOT RUN) |
| RF-65 | TC-000-86, TC-000-95 | tests/unit/ci/gitlab-ci.test.ts › TC-000-86<br>tests/unit/ci/gitlab-ci.test.ts › TC-000-95 | PASS |
| RF-66 | TC-000-86, TC-000-89 | tests/unit/ci/gitlab-ci.test.ts › TC-000-86<br>TC-000-89: manual (NOT RUN) | PARTIAL (a manual TC is NOT RUN) |
| RF-67 | TC-000-86, TC-000-89 | tests/unit/ci/gitlab-ci.test.ts › TC-000-86<br>TC-000-89: manual (NOT RUN) | PARTIAL (a manual TC is NOT RUN) |

## Manual test cases (Automate: N)
| Test case | Reason | Result |
|-----------|--------|--------|
| TC-000-01 npm ci installs dependencies and three browsers | Needs a clean install and a full browser download | PASS. `npm ci` exit 0 locally (T1: postinstall downloaded chromium 1243, firefox 1543 and webkit 2359; the old `node_modules` was removed by `npm ci`); `npx playwright --version` → 1.63.0. All three browsers launched without another install command (`npx playwright test`, 10/10 on api + 3 browsers). In CI every job runs `npm ci` on a fresh container (exit 0). Caveat: locally it was not a brand-new machine, though the browser revisions used were downloaded fresh |
| TC-000-02 npm ci on Node 18 fails naming the required version | Needs another Node major | PASS. In a temp copy (package.json, lockfile, .npmrc) on Node v18.20.8 via Volta: `npm ci` exit non-zero, `EBADENGINE`, "Required: {\"node\":\">=20\"}"; no `node_modules` created, no browser downloaded |
| TC-000-36 failing smoke run leaks no email or password | Needs an intentionally failing run against the shared site | PASS. `TEST_USER_PASSWORD=TEST_wrong_pass npx playwright test --grep @smoke --project=api` → 1 failed: "Login API returned status 400 for the account in TEST_USER_EMAIL". The console output contains none of the 4 real TEST_USER_* values (checked by script, names only); `npm run check:secrets` passed. Account A logged in normally afterwards |
| TC-000-37 smoke artifacts pass the secrets scan in every pipeline | Enforced by the check:secrets jobs | PASS. Pipeline #2924894818: `check-secrets-api` and `check-secrets-ui-chromium` succeeded ("no sensitive value in 4 file(s)" each) |
| TC-000-88 push to eyter_dev runs a green pipeline with test report | Needs a real GitLab pipeline | PASS. Pipeline #2924894818 (push of 626998f): all 8 jobs succeeded. The Tests tab shows 2/2 (JUnit published); "Flaky tests: 0" in both smoke jobs |
| TC-000-89 a failing job fails the pipeline and keeps evidence | Needs a temporary failing commit on eyter_dev | **NOT RUN (partial evidence accepted by the user, 2026-10-08).** Partial evidence: pipeline #2924882205 (aad8209) failed because the `unit` job failed (TC-000-41, see Issues), and the smoke/scan stages were skipped. That shows RF-59. It does not show the TC's expected result: a failing smoke test in the Tests tab, with report and test-results artifacts downloadable. That needs a deliberately failing smoke commit pushed to eyter_dev and then reverted |
| TC-000-93 credential variables are masked and protected | GitLab settings review | PASS. Read through the GitLab API (names and flags only, values never read): TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_2_EMAIL, TEST_USER_2_PASSWORD are masked=true and protected=true (BASE_URL and API_BASE_URL are too). Protected branches: main, eyter_dev, release, production |
| TC-000-94 unprotected branch run gets no credentials and leaks nothing | Needs a pipeline on a temporary unprotected branch | **NOT RUN (partial evidence accepted by the user, 2026-10-08).** Needs a temporary branch pushed to GitLab and a manual run. AGENTS.md forbids the agent to delete branches, so the branch would remain until the user removes it. The user's decision is needed |

## Quality gates
| Gate | Result | Notes |
|------|--------|-------|
| Tests: `npx playwright test --grep "TC-000-"` | PASS | 10 passed, 0 failed, 0 flaky (api, chromium, firefox, webkit; real site and API, plus mocked tests) |
| Tests: `npm run test:unit` | PASS | 23 files, 83 passed, 0 failed |
| Lint (`npm run lint`) | PASS | exit 0 |
| Typecheck (`npm run typecheck`) | PASS | exit 0 |
| spec:check (`npm run spec:check`) | PASS | "spec:check passed (1 spec(s))"; `docs/traceability.md`: 140 rows, 126 automated, 14 manual, 0 missing |
| check:secrets (`npm run check:secrets`) | PASS | no sensitive value in the run's artifacts |
| CI pipeline on eyter_dev | PASS | #2924894818: 8/8 jobs green |
| Test review checklist | PASS | Applied to every changed test, page object, fixture and client at the close of each task T1–T33 (see implementation.md). Issues found during review were fixed before closing: simplified Arrange in TC-000-33, typed helpers in T14, diagnostic messages in TC-000-28 |

## Done criteria
- [x] Every RF has approved test cases (67/67 RFs; test-cases.md approved; spec:check RF-39 rule green)
- [x] All automated TCs green on chromium and in the `api` project (87/87 automated TCs pass, also on firefox and webkit)
- [x] test-reviewer PASS
- [x] `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS
- [x] Pipeline on `eyter_dev` green (#2924894818)
- [x] User validation (2026-10-08: the user accepted the partial evidence for TC-000-89 and TC-000-94 and confirmed the spec as validated)

## Issues found
1. **Manual TCs not run: TC-000-89 and TC-000-94.** RF-59, RF-64, RF-66 and RF-67 are therefore
   PARTIAL: their automated TCs pass, but one manual TC each has no result.
   - TC-000-89 needs a deliberately failing smoke commit on eyter_dev, reverted afterwards.
   - TC-000-94 needs a temporary unprotected branch on GitLab, which the agent may not delete.
2. **Defect found by the first pipeline, fixed.** Pipeline #2924882205 failed: TC-000-41 could not
   launch chromium in CI. The CLI test helper did not pass `PLAYWRIGHT_BROWSERS_PATH` to child
   processes. Fixed in 626998f, verified locally (the variable reaches the child) and in CI
   (#2924894818 green).
3. **Intermittent failure seen once, not reproduced.** TC-000-28 and TC-000-41 failed once in a
   full local run under load (T27). Since then they passed in about 10 local full runs and in CI.
   Diagnostics were added; still under observation.
4. **Spec changes made during implementation (Mode C, approved by the user):**
   - NFR: CI uses the Node of the Playwright image (24), not Node 20.
   - `@types/node` was added to the dependency list.
   - The test data of TC-000-60 changed to a folder target, so the test also fails as root.
5. **Known limits recorded for later specs:**
   - The real Playwright error texts for DNS, refused-connection and timeout failures (RF-57) were
     only exercised with stubs.
   - The effective local Node minimum is 20.19, because of ESLint 10 and Vite.
   - Keeping passwords out of UI-login traces is left to the auth spec.
6. Open `[NEEDS CLARIFICATION]` items: none. Automate: Y TCs without a test: none. Uncovered RFs:
   none.

## Verdict
The spec IS NOT yet fulfilled.
- All 87 automated test cases pass, every quality gate is green, and the eyter_dev pipeline is
  green.
- Six of the eight manual test cases pass.
- TC-000-89 and TC-000-94 have not been executed, so RF-59, RF-64, RF-66 and RF-67 are only
  partially validated, and the done criterion "user validation" is open.
- The spec can be marked validated once these two manual TCs pass, or once the user explicitly
  accepts the partial evidence above for them.

### User decision (2026-10-08)
The user accepted the partial evidence for TC-000-89 and TC-000-94 and confirmed spec 000 as
**validated**. Both TCs stay recorded as NOT RUN; nothing is reported as passed that was not
executed.
- TC-000-89: pipeline #2924882205 showed a failing job failing the pipeline (RF-59).
- TC-000-94: protected variables and protected branches were confirmed through the GitLab API.

Recommended follow-up: run both TCs the next time a pipeline change is made. Spec status:
`validated`.

### Change after validation (2026-10-08)
Spec clarification 11 (Mode C, approved by the user) changed RF-33 and added RF-68: a missing
test fails `spec:check` only from status `implemented`, and is a warning before that.
- TC-000-53 (RF-33, RF-68): PASS — `tests/unit/spec-check/spec-check.test.ts`.
- TC-000-96 (RF-68, RF-42): PASS — `tests/unit/spec-check/spec-check.test.ts`.
- TC-000-58 (RF-42, RF-43) with its updated fixture: PASS — `tests/unit/spec-check/spec-check-write.test.ts`.
- `npm run test:unit` 84/84, lint and typecheck PASS, `spec:check` passed (2 specs).
Spec 000 stays `validated`: 68 RFs, 96 TCs (88 automated, 8 manual).

### Change after validation: automatic promotion (2026-10-08)
Spec clarification 12 (Mode C, approved by the user) added RF-69 to RF-77, generalized RF-59 and
let RF-31 accept TC IDs with two or more digits.
- Automated, PASS: TC-000-86, 87, 97, 98, 99, 100, 101 (`tests/unit/ci/gitlab-ci.test.ts`,
  `tests/unit/spec-check/spec-check.test.ts`) and TC-000-102 to 108 (`tests/unit/ci/ci-promote.test.ts`).
- TC-000-109 (RF-69 to RF-72, RF-76, RF-77): **PASS**, live on 2026-10-08 after commit
  6e3a638 was pushed to eyter_dev:
  - eyter_dev pipeline 2925606874: 9/9 jobs green; `promote` logged "Promoted eyter_dev → release:
    merge request !4 merged at 6e3a638…".
  - release pipeline 2925619862 (release-regression on api, chromium, firefox, webkit): 7/7 green;
    MR !5 release → main merged.
  - main pipeline 2925638938 (main-smoke on api and three browsers): 7/7 green; MR !6 main →
    production merged.
  - production pipeline 2925654814 (production-smoke): 6/6 green, no `promote` job.
  - MRs !4, !5 and !6 have `force_remove_source_branch: false`; all four branches still exist.
    The token appears nowhere in the promote log (masked, protected variable).
- Manual, NOT RUN: TC-000-110 (a failing job stops the chain). It is recorded at the next natural
  failure, or with a temporary failing commit if the user approves one.
- `npm run test:unit` 96/96, lint and typecheck PASS, `spec:check` passed (2 specs).
Spec 000 stays `validated`: 77 RFs, 110 TCs (100 automated, 10 manual). RF-69 to RF-72, RF-76 and
RF-77 are validated by TC-000-109; RF-73 still awaits its live negative case (TC-000-110).

### Change after validation: GitHub mirror (2026-10-09)
Spec clarification 13 (Mode C, approved by the user) added RF-78 to RF-82.
- Automated, PASS: TC-000-111 to 117 (`tests/unit/ci/github-actions.test.ts`).
- Manual, pending: TC-000-118 (GitHub mirror run on eyter_dev), recorded after the first push
  once the user has set the GitHub secrets.
Spec 000 stays `validated`: 82 RFs, 118 TCs (107 automated, 11 manual).

### Change after validation: GitHub only (2026-10-09)
Spec clarification 14 (Mode C, approved by the user) moves CI and promotion to GitHub Actions and
removes GitLab.
- Automated, PASS:
  - `tests/unit/ci/github-actions.test.ts`: TC-000-04, 86, 87, 95, 98 to 101 and 114 to 116;
  - `tests/unit/ci/ci-promote.test.ts`: TC-000-102 to 108.
- Removed: TC-000-111, 112, 113 and 117 (duplicates).
- Manual: TC-000-88, 89, 93, 94, 109, 110 and 118 are re-run against GitHub Actions. The earlier
  GitLab results no longer apply.
- Spec 000 stays `validated`: 82 RFs, 114 TCs (103 automated, 11 manual).
- Live, PASS (2026-10-09), commit `83ba6e7`:
  - TC-000-118 / TC-000-88: eyter_dev run 37925874939 green (4 min 30 s).
  - TC-000-109: the promotion chain reached production with every run green:
    - release run 37926325361 (regression on api, chromium, firefox and webkit, 29 min);
    - main run 37929397499;
    - production run 37930026405, where `promote` was skipped (RF-73).
  - All four branches still exist and contain `83ba6e7`: release `85cca1b`, main `232b1d4`,
    production `eb880bf`.
- Still to observe: TC-000-89, 94 and 110 (manual).

### Change after validation: staged jobs, test summaries and results page (2026-10-09)
Spec clarifications 15 to 17 (Mode C, approved by the user): chained stage jobs (RF-83), test
summaries and coverage (RF-84 to RF-87), GitHub Pages results page and README guide (RF-88, RF-89).
- Automated, PASS: TC-000-119 to 132, 134 and 135 (tasks T34 to T41); unit suite 119 passed.
- Spec 000 stays `validated`: 89 RFs, 132 TCs (119 automated, 13 manual).
- **TC-000-136 git history has no secrets before the repository is made public — PASS (2026-10-09).**
  - Scope: `git log --all --full-history -p` plus commit messages; 24 commits on every local and
    remote branch (`origin` fetched first).
  - Searched for the `.env` values of TEST_USER_PASSWORD and TEST_USER_2_PASSWORD, plain and
    URL-encoded, and for the two account emails. Also searched for JWT-shaped tokens, GitHub tokens
    (`ghp_`, `gho_`, `ghs_`, `github_pat_`) and private keys, and checked whether `.env` was ever
    committed. Counts only; no value was printed.
  - Result: passwords 0, emails 0, GitHub tokens 0, private keys 0, `.env` commits 0. One
    JWT-shaped match: the fake fixture token in `tests/unit/security/check-secrets.test.ts`
    (commit `aad82099`; header `{"alg":"TEST"}`, payload `{"sub":"TEST_user"}`), not a real token.
- Next, by the maintainer: make the repository public, set Pages source GitHub Actions, and allow
  the four branches in the `github-pages` environment. Then TC-000-118, TC-000-133 and TC-000-110
  run on real GitHub Actions runs.
- **Live runs for `70a4ede` (2026-10-09), all green:**
  - TC-000-118 PASS: eyter_dev run 37942914229, jobs in order checks (spec:check, lint, typecheck
    in parallel) → unit-tests → eyter-dev-api → eyter-dev-ui-chromium → publish-results → promote;
    the 11 jobs of the other branches were skipped.
  - Promotion chain PASS: release run 37943859009 (api → chromium → firefox → webkit, regression),
    main run 37946344274, production run 37947365291 (promote skipped, RF-73).
  - TC-000-133 PARTIAL: the results page showed eyter_dev (`70a4ede`, passed; unit 119 with
    56.12 % line coverage, API 5, UI chromium 6) and release (`d3f1f87`, passed; API 45, UI 78 on
    each browser) and kept eyter_dev when release published (RF-88). The main and production
    deployments reported success, but GitHub Pages was then found disabled (Pages API and site
    404), so those two entries could not be read back. Pages was re-enabled
    (`POST /pages`, `build_type: workflow`; the `github-pages` environment kept its 4 branches).
    The page refills from the next push chain (404 = first publication); re-checked then.
- Still to observe: TC-000-110 (a failing job stops the chain), TC-000-89 and 94 (manual).
- **TC-000-133 GitHub Pages shows the results of a real push run — PASS (2026-10-10).** Chain for
  `ad6969b`: eyter_dev 38026249336 → release 38026556885 → main 38027628226 → production
  38028080415, all green. The results page lists the four branches, each `passed`: eyter_dev
  `ad6969b` (4 stages), release `4e20f6e` (6 stages), main `5aee761` (6 stages), production
  `10e657a` (4 stages); each publication kept the earlier branches' entries (RF-88).

### Change after validation: manual runs by layer, regression chain, VS Code tasks, bug log (2026-10-10)
Spec clarifications 18 and 19 (Mode C, approved by the user): LAYER for manual runs (RF-90), the
regression chain from eyter_dev (RF-91, RF-92), VS Code tasks (RF-93), README (RF-94) and the bug
log (RF-95).
- Automated, PASS: TC-000-137 to 144, 146, 148, 150 and 151 (tasks T42 to T47); unit suite 131 passed.
- Spec 000 stays `validated`: 97 RFs, 157 TCs (140 automated, 17 manual) after clarifications 20 and 21 (T48, T49: TC-000-152 to 158, 160, 161 PASS).
- Still to run (manual): TC-000-145 (live regression chain from eyter_dev; also resolves the RF-91
  TODO: VERIFY about dispatching with GITHUB_TOKEN), TC-000-147 (direct regression on release
  refused), TC-000-149 (each VS Code task once), and TC-000-110 (a failing job stops the chain).
