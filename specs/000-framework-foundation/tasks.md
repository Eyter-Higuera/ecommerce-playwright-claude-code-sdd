# Tasks — Spec 000 Framework foundation

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/000-framework-foundation/spec.md · Plan: specs/000-framework-foundation/plan.md

Rules: one task at a time, tests first, max 20-30 minutes per task, in dependency order.
Unit test commands use `npx vitest run <file> -t "<TC pattern>"`; a task is done only when its
own TCs pass and the earlier tasks' tests still pass. Manual TCs (TC-000-01, 02, 36, 37, 88, 89,
93, 94) are executed in the validation phase, not in these tasks.

## Setup and tooling

- [x] T1 — Bootstrap the npm project, TypeScript and Vitest
  - Covers: RF-1, RF-3, RF-5 / TC-000-03
  - Depends on: —
  - Files: package.json (engines `>=20`, exact `@playwright/test`, approved deps + `@types/node`, scripts `test:unit`, `typecheck`, `postinstall`), package-lock.json, .npmrc, tsconfig.json, vitest.config.mts, .gitignore (`reports/`), tests/unit/setup/manifest.test.ts
  - Done when: `npm ci` exits 0 and `npx vitest run tests/unit/setup/manifest.test.ts -t "TC-000-03"` passes

- [x] T2 — Add the CLI test helper and verify the Vitest runner exit codes
  - Covers: RF-5 / TC-000-08, TC-000-09
  - Depends on: T1
  - Files: tests/unit/helpers/run-cli.ts, tests/fixtures/vitest/passing/, tests/fixtures/vitest/failing/, tests/unit/setup/vitest-runner.test.ts
  - Done when: `npx vitest run tests/unit/setup/vitest-runner.test.ts -t "TC-000-0[89]"` passes (2 tests)

- [x] T3 — Block outbound network access in unit tests
  - Covers: RF-6 / TC-000-10, TC-000-11
  - Depends on: T1
  - Files: tests/unit/setup/block-network.ts, vitest.config.mts (setupFiles), tests/unit/setup/network-guard.test.ts
  - Done when: `npx vitest run tests/unit/setup/network-guard.test.ts -t "TC-000-1[01]"` passes (2 tests)

- [x] T4 — Enforce strict type checking
  - Covers: RF-4 / TC-000-06, TC-000-07
  - Depends on: T2
  - Files: tsconfig.json, tests/fixtures/typecheck/invalid/, tests/unit/setup/typecheck.test.ts
  - Done when: `npx vitest run tests/unit/setup/typecheck.test.ts -t "TC-000-0[67]"` passes and `npm run typecheck` exits 0

- [x] T5 — Configure ESLint rules for hard waits and unawaited Playwright calls
  - Covers: RF-27, RF-28 / TC-000-42, TC-000-43, TC-000-44, TC-000-45
  - Depends on: T1
  - Files: eslint.config.mjs, package.json (`lint` script), tests/fixtures/lint/, tests/unit/lint/eslint-rules.test.ts
  - Done when: `npx vitest run tests/unit/lint/eslint-rules.test.ts -t "TC-000-4[2-5]"` passes (4 tests)

- [x] T6 — Configure ESLint import separation and lint scope
  - Covers: RF-29, RF-30 / TC-000-46, TC-000-47, TC-000-48, TC-000-49
  - Depends on: T5
  - Files: eslint.config.mjs, tests/fixtures/lint/, tests/unit/lint/eslint-rules.test.ts
  - Done when: `npx vitest run tests/unit/lint/eslint-rules.test.ts -t "TC-000-4[6-9]"` passes (4 tests) and `npm run lint` exits 0

## Configuration and secrets

- [x] T7 — Implement the environment loader and the requireEnv accessor
  - Covers: RF-7, RF-13, RF-14, RF-15, RF-17 / TC-000-13, TC-000-22, TC-000-23, TC-000-24, TC-000-25
  - Depends on: T1
  - Files: src/config/env.ts, src/errors/messages.ts (RF-17 message), tests/fixtures/env/dotenv/sample.env, tests/unit/config/env.test.ts
  - Done when: `npx vitest run tests/unit/config/env.test.ts -t "TC-000-(13|2[2-5])"` passes (5 tests)

- [x] T8 — Prove the unit suite needs no environment variables
  - Covers: RF-7 / TC-000-12
  - Depends on: T2, T7
  - Files: tests/fixtures/vitest/no-env/, tests/unit/setup/vitest-runner.test.ts
  - Done when: `npx vitest run tests/unit/setup/vitest-runner.test.ts -t "TC-000-12"` passes

- [x] T9 — Add .env.example and its sync check
  - Covers: RF-18, RF-19 / TC-000-29, TC-000-30, TC-000-31, TC-000-32
  - Depends on: T7
  - Files: .env.example, tests/fixtures/env/example-missing/, tests/fixtures/env/example-extra/, tests/unit/config/env-example.test.ts
  - Done when: `npx vitest run tests/unit/config/env-example.test.ts -t "TC-000-(29|3[0-2])"` passes (4 tests)

- [x] T10 — Implement the redaction helper and the failure message builders
  - Covers: RF-20, RF-21 / TC-000-33, TC-000-34, TC-000-35
  - Depends on: T7
  - Files: src/security/redact.ts, src/errors/messages.ts, tests/unit/security/redaction.test.ts
  - Done when: `npx vitest run tests/unit/security/redaction.test.ts -t "TC-000-3[3-5]"` passes (3 tests)

- [x] T11 — Implement the TEST_ data factory
  - Covers: RF-44, RF-45 / TC-000-66, TC-000-67, TC-000-68
  - Depends on: T1
  - Files: src/data/test-data-factory.ts, tests/unit/data/test-data-factory.test.ts
  - Done when: `npx vitest run tests/unit/data/test-data-factory.test.ts -t "TC-000-6[6-8]"` passes (3 tests)

## Sanity smoke building blocks

- [x] T12 — Add the login URL builder and the time budget constants
  - Covers: RF-52 / TC-000-77
  - Depends on: T1
  - Files: src/config/urls.ts, src/config/timeouts.ts, tests/unit/smoke/login-url.test.ts
  - Done when: `npx vitest run tests/unit/smoke/login-url.test.ts -t "TC-000-77"` passes

- [x] T13 — Implement the login response checks, the schema and AuthClient
  - Covers: RF-54, RF-55, RF-56, RF-57 / TC-000-81, TC-000-82, TC-000-83, TC-000-84, TC-000-85
  - Depends on: T10, T12
  - Files: src/api/auth-client.ts, src/api/schemas/login-response.schema.ts, src/api/login-response.ts, tests/unit/smoke/login-response.test.ts
  - Done when: `npx vitest run tests/unit/smoke/login-response.test.ts -t "TC-000-8[1-5]"` passes (5 tests)

- [x] T14 — Build the Playwright config: projects, reporters, retries and tracing
  - Covers: RF-8, RF-9, RF-10, RF-11, RF-25, RF-46, RF-47, RF-48, RF-49 / TC-000-40, TC-000-69, TC-000-71, TC-000-72
  - Depends on: T7
  - Files: src/config/playwright-options.ts, playwright.config.ts, tests/unit/reporting/reporters.test.ts, tests/unit/reporting/tracing.test.ts
  - Done when: `npx vitest run tests/unit/reporting -t "TC-000-(40|69|7[12])"` passes (4 tests)

## Sanity smoke tests

- [x] T15 — Create LoginPage, the Playwright fixtures and the UI sanity test
  - Covers: RF-8, RF-52, RF-53 / TC-000-76
  - Depends on: T12, T14
  - Files: src/pages/login-page.ts, src/pages/login-page.constants.ts, src/fixtures/test.ts, tests/ui/login-page.spec.ts
  - Done when: `npx playwright test tests/ui/login-page.spec.ts --project=chromium --project=firefox --project=webkit` passes (TC-000-76 on 3 browsers); locator names verified on the live page (TODO: VERIFY resolved)

- [x] T16 — Add the mocked unavailable and timeout login page tests
  - Covers: RF-52, RF-53 / TC-000-78, TC-000-79
  - Depends on: T15
  - Files: tests/mocked/login-page-unavailable.spec.ts
  - Done when: `npx playwright test tests/mocked/login-page-unavailable.spec.ts --project=chromium` passes (2 tests)

- [x] T17 — Add the API sanity test with account A
  - Covers: RF-22, RF-26, RF-54, RF-55, RF-56, RF-57 / TC-000-80
  - Depends on: T13, T14, T15
  - Files: src/fixtures/test.ts (`authClient`, `accountA`), tests/api/auth-login.spec.ts
  - Done when: `npx playwright test tests/api/auth-login.spec.ts --project=api` passes (TC-000-80) and no trace or body attachment exists for it under `test-results/`

## Playwright run behavior

- [x] T18 — Stop the run on invalid base URLs
  - Covers: RF-16 / TC-000-26, TC-000-27
  - Depends on: T2, T15
  - Files: src/config/env.ts (`validateBaseUrls`), playwright.config.ts, tests/unit/config/base-url-validation.test.ts
  - Done when: `npx vitest run tests/unit/config/base-url-validation.test.ts -t "TC-000-2[67]"` passes (2 tests)

- [x] T19 — Verify project selection, msedge opt-in and the single api run
  - Covers: RF-8, RF-9, RF-10, RF-11 / TC-000-14, TC-000-15, TC-000-16, TC-000-17, TC-000-18, TC-000-19
  - Depends on: T16, T17, T18
  - Files: tests/unit/playwright/projects.test.ts, src/config/playwright-options.ts (msedge argv detection)
  - Done when: `npx vitest run tests/unit/playwright/projects.test.ts -t "TC-000-1[4-9]"` passes (6 tests)

- [x] T20 — Verify tag selection with --grep
  - Covers: RF-12 / TC-000-20, TC-000-21
  - Depends on: T19
  - Files: tests/unit/playwright/projects.test.ts
  - Done when: `npx vitest run tests/unit/playwright/projects.test.ts -t "TC-000-2[01]"` passes (2 tests)

- [x] T21 — Verify a missing credential fails only the test that reads it
  - Covers: RF-13, RF-17 / TC-000-28
  - Depends on: T2, T17
  - Files: tests/fixtures/playwright/two-tests/, tests/unit/config/credential-isolation.test.ts
  - Done when: `npx vitest run tests/unit/config/credential-isolation.test.ts -t "TC-000-28"` passes

- [x] T22 — Verify reports on failure and traces on the first retry
  - Covers: RF-25, RF-46, RF-49 / TC-000-70, TC-000-41
  - Depends on: T2, T14
  - Files: tests/fixtures/playwright/failing/, tests/fixtures/playwright/retry-trace/, tests/unit/reporting/reporters.test.ts, tests/unit/reporting/tracing.test.ts
  - Done when: `npx vitest run tests/unit/reporting -t "TC-000-(70|41)"` passes (2 tests)

- [x] T23 — Mark flaky tests and print the flaky count
  - Covers: RF-50, RF-51 / TC-000-73, TC-000-74, TC-000-75
  - Depends on: T22
  - Files: scripts/flaky-summary.ts, tsconfig.scripts.json, package.json (`build:scripts`, `report:flaky`), src/fixtures/test.ts (retry annotation fallback, if needed), tests/fixtures/playwright/flaky/, tests/fixtures/playwright/stable/, tests/unit/reporting/flaky.test.ts
  - Done when: `npx vitest run tests/unit/reporting/flaky.test.ts -t "TC-000-7[3-5]"` passes (3 tests); JUnit flaky representation verified (TODO: VERIFY resolved)

## Traceability gate

- [x] T24 — Implement the spec:check parsers, title scanner and title rule
  - Covers: RF-31, RF-32, RF-40, RF-41 / TC-000-50, TC-000-51, TC-000-52, TC-000-65
  - Depends on: T23
  - Files: scripts/spec-check/ (parse-spec, parse-test-cases, scan-titles, run), package.json (`spec:check`), tests/fixtures/spec-check/, tests/unit/spec-check/spec-check.test.ts
  - Done when: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-(5[0-2]|65)"` passes (4 tests)

- [x] T25 — Add the spec:check rules for missing, duplicate, unknown and skipped tests
  - Covers: RF-33, RF-34, RF-35, RF-36, RF-37 / TC-000-53, TC-000-54, TC-000-55, TC-000-56, TC-000-57
  - Depends on: T24
  - Files: scripts/spec-check/rules.ts, tests/fixtures/spec-check/, tests/unit/spec-check/spec-check.test.ts
  - Done when: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-5[3-7]"` passes (5 tests)

- [x] T26 — Add the spec:check rules that depend on spec status
  - Covers: RF-38, RF-39 / TC-000-61, TC-000-62, TC-000-63, TC-000-64
  - Depends on: T25
  - Files: scripts/spec-check/rules.ts, tests/fixtures/spec-check/, tests/unit/spec-check/spec-check.test.ts
  - Done when: `npx vitest run tests/unit/spec-check/spec-check.test.ts -t "TC-000-6[1-4]"` passes (4 tests)

- [x] T27 — Add spec:check --write for the traceability matrix
  - Covers: RF-37, RF-42, RF-43 / TC-000-58, TC-000-59, TC-000-60
  - Depends on: T26
  - Files: scripts/spec-check/write-matrix.ts, tests/unit/spec-check/spec-check-write.test.ts
  - Done when: `npx vitest run tests/unit/spec-check/spec-check-write.test.ts -t "TC-000-(5[89]|60)"` passes (3 tests)

## Secrets scan and CI

- [x] T28 — Implement the zip reader and check:secrets
  - Covers: RF-22, RF-23, RF-24 / TC-000-38, TC-000-39
  - Depends on: T10, T23
  - Files: scripts/lib/zip-reader.ts, scripts/check-secrets.ts, package.json (`check:secrets`), tests/unit/helpers/make-zip.ts, tests/unit/security/check-secrets.test.ts
  - Done when: `npx vitest run tests/unit/security/check-secrets.test.ts -t "TC-000-3[89]"` passes (2 tests)

- [x] T29 — Implement the Playwright image version check
  - Covers: RF-2 / TC-000-05
  - Depends on: T23
  - Files: scripts/lib/playwright-version.ts, tests/fixtures/ci/, tests/unit/ci/playwright-image-version.test.ts
  - Done when: `npx vitest run tests/unit/ci/playwright-image-version.test.ts -t "TC-000-05"` passes (TC-000-04 is completed in T32, once `.gitlab-ci.yml` exists)

- [x] T30 — Implement the manual-run suite selector
  - Covers: RF-60, RF-61, RF-62, RF-63 / TC-000-90, TC-000-91, TC-000-92
  - Depends on: T19, T23
  - Files: scripts/ci-run-suite.ts, package.json (`ci:run-suite`), tests/unit/ci/ci-run-suite.test.ts
  - Done when: `npx vitest run tests/unit/ci/ci-run-suite.test.ts -t "TC-000-9[0-2]"` passes (3 tests)

- [x] T31 — Implement the CI script check for environment printing
  - Covers: RF-65 / TC-000-95
  - Depends on: T23
  - Files: scripts/check-ci-scripts.ts, tests/fixtures/ci/print-env/, tests/unit/ci/gitlab-ci.test.ts
  - Done when: `npx vitest run tests/unit/ci/gitlab-ci.test.ts -t "TC-000-95"` passes

- [x] T32 — Write the eyter_dev GitLab pipeline
  - Covers: RF-2, RF-58, RF-59, RF-64, RF-65, RF-66, RF-67 / TC-000-86, TC-000-87, TC-000-04
  - Depends on: T28, T29, T30, T31
  - Files: .gitlab-ci.yml, tests/unit/ci/gitlab-ci.test.ts, tests/unit/ci/playwright-image-version.test.ts
  - Done when: `npx vitest run tests/unit/ci -t "TC-000-(0[45]|8[67]|95)"` passes (5 tests); the Node major of the Playwright image is recorded (TODO: VERIFY resolved, or a Mode C spec change proposed)

## Final gate

- [x] T33 — Document setup and run the full local gate
  - Covers: RF-1, RF-40, RF-42 (repository run) / no new TCs
  - Depends on: T1 to T32
  - Files: README.md (setup, account A recovery, `CI=true` locally), docs/traceability.md (regenerated)
  - Done when: `npm run lint`, `npm run typecheck`, `npm run test:unit` and `npm run spec:check` exit 0; `npm run spec:check -- --write` lists no `missing` row for spec 000; `npx playwright test --grep @smoke --project=api --project=chromium` passes; `npm run check:secrets` exits 0

## Change after validation: staged jobs, test summaries and results page (clarifications 15 to 17)

- [x] T34 — Split the workflow into chained stage jobs
  - Covers: RF-58, RF-69, RF-70, RF-71, RF-78, RF-80, RF-83 / TC-000-86, TC-000-87, TC-000-98, TC-000-99, TC-000-100, TC-000-101, TC-000-114, TC-000-115, TC-000-116, TC-000-119
  - Depends on: —
  - Files: .github/workflows/ci.yml, tests/unit/ci/github-actions.test.ts
  - Done when: `npm run test:unit -- tests/unit/ci` passes

- [x] T35 — Implement the test summary script
  - Covers: RF-84, RF-87 / TC-000-120, TC-000-121, TC-000-122, TC-000-125, TC-000-135
  - Depends on: —
  - Files: scripts/test-summary.ts, package.json (`report:summary`), tests/fixtures/reports/summary/, tests/unit/reporting/test-summary.test.ts
  - Done when: `npx vitest run tests/unit/reporting/test-summary.test.ts` passes (5 tests)

- [x] T36 — Add unit-test code coverage
  - Covers: RF-85 / TC-000-123, TC-000-124
  - Depends on: T35
  - Files: package.json (`@vitest/coverage-v8`, `test:unit:ci`), package-lock.json, vitest.config.mts, scripts/test-summary.ts, tests/unit/reporting/unit-coverage.test.ts
  - Done when: `npx vitest run tests/unit/reporting -t "TC-000-12[34]"` passes (2 tests) and `npm run test:unit:ci` writes `reports/unit-results.json` and `reports/coverage/coverage-summary.json`

- [x] T37 — Add spec:check --summary
  - Covers: RF-86 / TC-000-126
  - Depends on: —
  - Files: scripts/spec-check/summary.ts, scripts/spec-check/run.ts, tests/fixtures/spec-check/summary/, tests/unit/spec-check/spec-check-summary.test.ts
  - Done when: `npx vitest run tests/unit/spec-check/spec-check-summary.test.ts` passes

- [x] T38 — Wire the summaries into the workflow
  - Covers: RF-79, RF-84, RF-85, RF-86 / TC-000-127
  - Depends on: T34, T35, T36, T37
  - Files: .github/workflows/ci.yml, tests/unit/ci/github-actions.test.ts
  - Done when: `npm run test:unit -- tests/unit/ci` passes

- [x] T39 — Implement the results page builder
  - Covers: RF-88 / TC-000-128, TC-000-129, TC-000-131, TC-000-134
  - Depends on: T35, T37
  - Files: scripts/results-page.ts, package.json (`report:pages`), tests/fixtures/reports/pages/, tests/unit/reporting/results-page.test.ts
  - Done when: `npx vitest run tests/unit/reporting/results-page.test.ts` passes (4 tests)

- [x] T40 — Add the publish-results job
  - Covers: RF-81, RF-88 / TC-000-130
  - Depends on: T38, T39
  - Files: .github/workflows/ci.yml, tests/unit/ci/github-actions.test.ts
  - Done when: `npm run test:unit -- tests/unit/ci` passes

- [x] T41 — Publish results and the manual-testing guide in the README
  - Covers: RF-89 / TC-000-132
  - Depends on: T40
  - Files: README.md, AGENTS.md (commands, CI table), docs/test-plan.md (§6, §10), tests/unit/docs/readme.test.ts
  - Done when: `npx vitest run tests/unit/docs/readme.test.ts` passes; lint, typecheck, test:unit and spec:check exit 0

Manual TCs of this change (TC-000-110, TC-000-118, TC-000-133, TC-000-136) are executed at validation;
TC-000-136 runs before the repository is made public.

## Change after validation: manual runs by layer, regression chain, VS Code tasks, bug log (clarifications 18 and 19)

- [x] T42 — Add LAYER to the manual-run selector
  - Covers: RF-61, RF-62, RF-90 / TC-000-137, TC-000-138, TC-000-139, TC-000-140
  - Depends on: —
  - Files: scripts/ci-run-suite.ts, tests/unit/ci/ci-run-suite.test.ts
  - Done when: `npx vitest run tests/unit/ci/ci-run-suite.test.ts` passes

- [x] T43 — Split the manual run into layer jobs and add the regression guard
  - Covers: RF-80, RF-83, RF-90, RF-92 / TC-000-141, TC-000-146, TC-000-115, TC-000-119, TC-000-130
  - Depends on: T42
  - Files: .github/workflows/ci.yml, tests/unit/ci/github-actions.test.ts
  - Done when: `npm run test:unit -- tests/unit/ci` passes

- [x] T44 — Implement the regression chain
  - Covers: RF-81, RF-91 / TC-000-142, TC-000-143, TC-000-144
  - Depends on: T43
  - Files: scripts/ci-chain.ts, package.json (`ci:chain`), .github/workflows/ci.yml, tests/unit/ci/ci-chain.test.ts, tests/unit/ci/github-actions.test.ts
  - Done when: `npm run test:unit -- tests/unit/ci` passes

- [x] T45 — Add the VS Code tasks
  - Covers: RF-93 / TC-000-148
  - Depends on: T42
  - Files: .vscode/tasks.json, .vscode/extensions.json, tests/unit/docs/vscode-tasks.test.ts
  - Done when: `npx vitest run tests/unit/docs/vscode-tasks.test.ts` passes

- [x] T46 — Add the bug log and its AGENTS.md rule
  - Covers: RF-95 / TC-000-151
  - Depends on: —
  - Files: docs/bug-log.md, AGENTS.md, tests/unit/docs/bug-log.test.ts
  - Done when: `npx vitest run tests/unit/docs/bug-log.test.ts` passes

- [x] T47 — Document the manual runs in the README
  - Covers: RF-94 / TC-000-150
  - Depends on: T43, T44, T45, T46
  - Files: README.md, AGENTS.md (commands), docs/test-plan.md (§6), tests/unit/docs/readme.test.ts
  - Done when: `npx vitest run tests/unit/docs` passes; lint, typecheck, test:unit and spec:check exit 0

Manual TCs of this change (TC-000-145, TC-000-147, TC-000-149) are executed at validation.

## Change after validation: failure report and /fix-failure (clarifications 20 and 21)

- [x] T48 — Implement the failure report and the local unit results
  - Covers: RF-90, RF-93, RF-96 / TC-000-152, TC-000-153, TC-000-154, TC-000-155, TC-000-156, TC-000-157, TC-000-160, TC-000-161
  - Depends on: —
  - Files: scripts/failure-report.ts, scripts/ci-run-suite.ts, package.json (`report:failures`, `test:unit:report`), tests/fixtures/reports/failures/, tests/unit/reporting/failure-report.test.ts
  - Done when: `npx vitest run tests/unit/reporting/failure-report.test.ts` passes

- [x] T49 — Add the /fix-failure skill, its VS Code tasks and the README section
  - Covers: RF-93, RF-97 / TC-000-158, TC-000-148
  - Depends on: T48
  - Files: .claude/skills/fix-failure/SKILL.md, .vscode/tasks.json, README.md, AGENTS.md, tests/unit/docs/fix-failure.test.ts, tests/unit/docs/vscode-tasks.test.ts
  - Done when: `npx vitest run tests/unit/docs` passes; lint, typecheck, test:unit and spec:check exit 0

Manual TC of this change (TC-000-159) is executed at validation.

## Change after validation: local-only VS Code tasks and test:branch (clarifications 22 and 23)

- [x] T50 — Implement test:branch with worktrees outside the repository
  - Covers: RF-98 / TC-000-163, TC-000-164, TC-000-165, TC-000-166, TC-000-167, TC-000-168, TC-000-169, TC-000-172, TC-000-174
  - Depends on: —
  - Files: scripts/run-branch.ts, package.json (`test:branch`), tests/unit/ci/run-branch.test.ts
  - Done when: `npx vitest run tests/unit/ci/run-branch.test.ts` passes

- [x] T51 — Make the VS Code tasks local only and add report:failures --branch
  - Covers: RF-93, RF-96, RF-97 / TC-000-148, TC-000-170, TC-000-158
  - Depends on: T50
  - Files: .vscode/tasks.json, scripts/failure-report.ts, .claude/skills/fix-failure/SKILL.md, tests/unit/docs/vscode-tasks.test.ts, tests/unit/reporting/failure-report.test.ts, tests/unit/docs/fix-failure.test.ts
  - Done when: `npx vitest run tests/unit/docs tests/unit/reporting` passes

- [x] T52 — Document local manual tests and the GitHub manual run separately
  - Covers: RF-94 / TC-000-150
  - Depends on: T51
  - Files: README.md, AGENTS.md, docs/bug-log.md, tests/unit/docs/readme.test.ts
  - Done when: `npm run test:unit`, lint, typecheck and spec:check exit 0

Manual TC of this change (TC-000-171) is executed at validation.

## Change after validation: local workers and bug-log columns (clarification 24)

- [x] T53 — Limit local Playwright runs to 2 workers
  - Covers: RF-99 / TC-000-175, TC-000-176
  - Depends on: —
  - Files: src/config/playwright-options.ts, tests/unit/reporting/reporters.test.ts, README.md
  - Done when: `npx vitest run tests/unit/reporting/reporters.test.ts` passes

- [x] T54 — Add the Date column and the Cause and Solution columns to the bug log
  - Covers: RF-95 / TC-000-151
  - Depends on: —
  - Files: docs/bug-log.md, AGENTS.md, .claude/skills/fix-failure/SKILL.md, README.md, tests/unit/docs/bug-log.test.ts
  - Done when: `npx vitest run tests/unit/docs` passes; lint, typecheck and spec:check exit 0

## Change after validation: report and /fix-failure after VS Code runs (clarification 25)

- [x] T55 — Implement test:local: report in the browser, then /fix-failure on failure
  - Covers: RF-100 / TC-000-177, TC-000-178, TC-000-179, TC-000-180, TC-000-181, TC-000-182, TC-000-183
  - Depends on: —
  - Files: scripts/local-run.ts, package.json (`test:local`), tests/unit/ci/local-run.test.ts
  - Done when: `npx vitest run tests/unit/ci/local-run.test.ts` passes

- [x] T56 — Point the VS Code run tasks to test:local and document it
  - Covers: RF-93, RF-98, RF-100 / TC-000-148, TC-000-150
  - Depends on: T55
  - Files: .vscode/tasks.json, README.md, AGENTS.md, docs/bug-log.md, tests/unit/docs/vscode-tasks.test.ts, tests/unit/docs/readme.test.ts
  - Done when: `npm run test:unit`, lint, typecheck and spec:check exit 0

Manual TC of this change (TC-000-184) is executed at validation.

## Coverage check
| Test case (Automate: Y) | Task |
|-------------------------|------|
| TC-000-03 | T1 |
| TC-000-04 | T32 |
| TC-000-05 | T29 |
| TC-000-06 | T4 |
| TC-000-07 | T4 |
| TC-000-08 | T2 |
| TC-000-09 | T2 |
| TC-000-10 | T3 |
| TC-000-11 | T3 |
| TC-000-12 | T8 |
| TC-000-13 | T7 |
| TC-000-14 | T19 |
| TC-000-15 | T19 |
| TC-000-16 | T19 |
| TC-000-17 | T19 |
| TC-000-18 | T19 |
| TC-000-19 | T19 |
| TC-000-20 | T20 |
| TC-000-21 | T20 |
| TC-000-22 | T7 |
| TC-000-23 | T7 |
| TC-000-24 | T7 |
| TC-000-25 | T7 |
| TC-000-26 | T18 |
| TC-000-27 | T18 |
| TC-000-28 | T21 |
| TC-000-29 | T9 |
| TC-000-30 | T9 |
| TC-000-31 | T9 |
| TC-000-32 | T9 |
| TC-000-33 | T10 |
| TC-000-34 | T10 |
| TC-000-35 | T10 |
| TC-000-38 | T28 |
| TC-000-39 | T28 |
| TC-000-40 | T14 |
| TC-000-41 | T22 |
| TC-000-42 | T5 |
| TC-000-43 | T5 |
| TC-000-44 | T5 |
| TC-000-45 | T5 |
| TC-000-46 | T6 |
| TC-000-47 | T6 |
| TC-000-48 | T6 |
| TC-000-49 | T6 |
| TC-000-50 | T24 |
| TC-000-51 | T24 |
| TC-000-52 | T24 |
| TC-000-53 | T25 |
| TC-000-54 | T25 |
| TC-000-55 | T25 |
| TC-000-56 | T25 |
| TC-000-57 | T25 |
| TC-000-58 | T27 |
| TC-000-59 | T27 |
| TC-000-60 | T27 |
| TC-000-61 | T26 |
| TC-000-62 | T26 |
| TC-000-63 | T26 |
| TC-000-64 | T26 |
| TC-000-65 | T24 |
| TC-000-66 | T11 |
| TC-000-67 | T11 |
| TC-000-68 | T11 |
| TC-000-69 | T14 |
| TC-000-70 | T22 |
| TC-000-71 | T14 |
| TC-000-72 | T14 |
| TC-000-73 | T23 |
| TC-000-74 | T23 |
| TC-000-75 | T23 |
| TC-000-76 | T15 |
| TC-000-77 | T12 |
| TC-000-78 | T16 |
| TC-000-79 | T16 |
| TC-000-80 | T17 |
| TC-000-81 | T13 |
| TC-000-82 | T13 |
| TC-000-83 | T13 |
| TC-000-84 | T13 |
| TC-000-85 | T13 |
| TC-000-86 | T32, T34 |
| TC-000-87 | T32, T34 |
| TC-000-90 | T30 |
| TC-000-91 | T30 |
| TC-000-92 | T30 |
| TC-000-95 | T31 |
| TC-000-98 | T34 |
| TC-000-99 | T34 |
| TC-000-100 | T34 |
| TC-000-101 | T34 |
| TC-000-114 | T34 |
| TC-000-115 | T34, T43 |
| TC-000-116 | T34 |
| TC-000-119 | T34, T43 |
| TC-000-120 | T35 |
| TC-000-121 | T35 |
| TC-000-122 | T35 |
| TC-000-125 | T35 |
| TC-000-135 | T35 |
| TC-000-123 | T36 |
| TC-000-124 | T36 |
| TC-000-126 | T37 |
| TC-000-127 | T38 |
| TC-000-128 | T39 |
| TC-000-129 | T39 |
| TC-000-131 | T39 |
| TC-000-134 | T39 |
| TC-000-130 | T40, T43 |
| TC-000-132 | T41 |
| TC-000-137 | T42 |
| TC-000-138 | T42 |
| TC-000-139 | T42 |
| TC-000-140 | T42 |
| TC-000-141 | T43 |
| TC-000-146 | T43 |
| TC-000-142 | T44 |
| TC-000-143 | T44 |
| TC-000-144 | T44 |
| TC-000-148 | T45, T49, T51, T56 |
| TC-000-151 | T46, T54 |
| TC-000-150 | T47, T52, T56 |
| TC-000-152 | T48 |
| TC-000-153 | T48 |
| TC-000-154 | T48 |
| TC-000-155 | T48 |
| TC-000-156 | T48 |
| TC-000-157 | T48 |
| TC-000-160 | T48 |
| TC-000-161 | T48 |
| TC-000-158 | T49, T51 |
| TC-000-163 | T50 |
| TC-000-164 | T50 |
| TC-000-165 | T50 |
| TC-000-166 | T50 |
| TC-000-167 | T50 |
| TC-000-168 | T50 |
| TC-000-169 | T50 |
| TC-000-172 | T50 |
| TC-000-174 | T50 |
| TC-000-170 | T51 |
| TC-000-175 | T53 |
| TC-000-176 | T53 |
| TC-000-177 | T55 |
| TC-000-178 | T55 |
| TC-000-179 | T55 |
| TC-000-180 | T55 |
| TC-000-181 | T55 |
| TC-000-182 | T55 |
| TC-000-183 | T55 |
