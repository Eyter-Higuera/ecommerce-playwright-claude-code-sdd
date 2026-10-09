# Execution Report — Spec 000 Framework foundation

Spec: specs/000-framework-foundation/spec.md · Tasks: specs/000-framework-foundation/tasks.md ·
Log: specs/000-framework-foundation/implementation.md

This report is updated each time a task is completed. A task row reflects the task's
`Done when:` command; a file row reflects the tests that exercise that file.

Legend: ✅ = passed · ❌ = failed

## Summary
| Tasks completed | Passed | Failed |
|-----------------|--------|--------|
| 41 / 41 | ✅ 41 | ❌ 0 |

## Results
| Task / File | Purpose | Passed | Failed |
|-------------|---------|:------:|:------:|
| **T1 — Bootstrap the npm project, TypeScript and Vitest** | Done when: `npm ci` exits 0 and TC-000-03 passes | ✅ | |
| tests/unit/setup/manifest.test.ts | TC-000-03: the manifest enforces Node 20 or later (`engines.node` `>=20`, `engine-strict=true`) | ✅ | |
| package.json + package-lock.json | Approved dependencies, `engines.node` `>=20`, scripts `postinstall` (installs chromium, firefox, webkit), `typecheck`, `test:unit` | ✅ | |
| .npmrc | `engine-strict=true`, so `npm ci` fails on Node < 20 (RF-3) | ✅ | |
| tsconfig.json | TypeScript strict mode; excludes `tests/fixtures/**` (`npm run typecheck` exits 0) | ✅ | |
| vitest.config.mts | Runs only `tests/unit/**/*.test.ts` | ✅ | |
| .gitignore | Ignores `reports/` | ✅ | |
| **T2 — Add the CLI test helper and verify the Vitest runner exit codes** | Done when: TC-000-08 and TC-000-09 pass (2 tests) | ✅ | |
| tests/unit/setup/vitest-runner.test.ts | TC-000-08: exit code 0 when all tests pass · TC-000-09: non-zero exit code and the failing test named | ✅ | |
| tests/unit/helpers/run-cli.ts | Runs CLIs (Vitest, later tsc and Playwright) in a child process with a minimal environment; reused by later tasks | ✅ | |
| tests/fixtures/vitest/passing/ | Fixture project with one passing test and its own Vitest config | ✅ | |
| tests/fixtures/vitest/failing/ | Fixture project with one test that fails on purpose and its own Vitest config | ✅ | |
| **T3 — Block outbound network access in unit tests** | Done when: TC-000-10 and TC-000-11 pass (2 tests) | ✅ | |
| tests/unit/setup/network-guard.test.ts | TC-000-10: a mocked HTTP dependency works with no network · TC-000-11: real requests (localhost and remote; http, https, fetch) fail with "Network access is disabled in unit tests: <url>" | ✅ | |
| tests/unit/setup/block-network.ts | Vitest setup file that blocks every real HTTP(S) request in unit tests (RF-6) | ✅ | |
| vitest.config.mts | Registers the network guard as a setup file | ✅ | |
| **T4 — Enforce strict type checking** | Done when: TC-000-06 and TC-000-07 pass and `npm run typecheck` exits 0 | ✅ | |
| tests/unit/setup/typecheck.test.ts | TC-000-06: the repository has no type errors · TC-000-07: strict mode rejects a wrong assignment and an implicit `any`, naming the file, line and error code | ✅ | |
| tests/fixtures/typecheck/invalid/ | Intentionally invalid code compiled with the repository's strict options | ✅ | |
| **T5 — Configure ESLint rules for hard waits and unawaited Playwright calls** | Done when: TC-000-42 to TC-000-45 pass (4 tests) | ✅ | |
| tests/unit/lint/eslint-rules.test.ts | TC-000-42/44: compliant code has no lint error · TC-000-43: `waitForTimeout` is rejected · TC-000-45: four kinds of unawaited Playwright promise are rejected | ✅ | |
| tests/fixtures/lint/ | Four Playwright fixture files: web-first wait, hard wait, awaited calls, unawaited calls | ✅ | |
| eslint.config.mjs | Lint rules for RF-27/RF-28, type-aware TypeScript rules, Playwright recommended rules, global ignores | ✅ | |
| package.json | `lint` script (`eslint .`) | ✅ | |
| tests/unit/setup/block-network.ts | Two unnecessary type assertions removed after the first lint run (no behavior change) | ✅ | |
| **T6 — Configure ESLint import separation and lint scope** | Done when: TC-000-46 to TC-000-49 pass (4 tests) and `npm run lint` exits 0 | ✅ | |
| tests/unit/lint/eslint-rules.test.ts | TC-000-46: single-framework files pass · TC-000-47: mixed Playwright/Vitest imports rejected · TC-000-48: src, tests, scripts and root config are linted · TC-000-49: generated folders are ignored | ✅ | |
| tests/fixtures/lint/ (3 new files) | Playwright-only, Vitest-only and mixed-import fixtures | ✅ | |
| eslint.config.mjs | One test framework per file (`no-restricted-imports`) | ✅ | |
| **T7 — Implement the environment loader and the requireEnv accessor** | Done when: TC-000-13 and TC-000-22 to TC-000-25 pass (5 tests) | ✅ | |
| tests/unit/config/env.test.ts | TC-000-22: all six variables read · TC-000-23: `.env` values loaded · TC-000-24: process env wins over `.env` · TC-000-13 / TC-000-25: missing or empty value reported by name | ✅ | |
| src/config/env.ts | Configuration accessor: `loadEnv` and `requireEnv`; nothing read at import time | ✅ | |
| src/errors/messages.ts | "Missing required environment variable: <NAME>" message builder | ✅ | |
| tests/fixtures/env/dotenv/sample.env | `.env` fixture with TEST_ placeholder values | ✅ | |
| **T8 — Prove the unit suite needs no environment variables** | Done when: TC-000-12 passes | ✅ | |
| tests/unit/setup/vitest-runner.test.ts | TC-000-12: a Vitest run with no RF-13 variables and no `.env` exits 0 without a missing-variable error | ✅ | |
| tests/fixtures/vitest/no-env/ | Fixture project that imports the configuration modules and loads configuration with an empty environment | ✅ | |
| **T9 — Add .env.example and its sync check** | Done when: TC-000-29 to TC-000-32 pass (4 tests) | ✅ | |
| tests/unit/config/env-example.test.ts | TC-000-29: only the six variables, placeholders only · TC-000-30: `.env` ignored by git, `.env.example` tracked · TC-000-31: the real file is in sync · TC-000-32: drift named (missing / unexpected) | ✅ | |
| .env.example | Committed template: six RF-13 variables with placeholders and the public site URLs | ✅ | |
| tests/fixtures/env/example-missing/, example-extra/ | Drifted `.env.example` fixtures | ✅ | |
| src/config/env.ts | `findEnvExampleDrift` sync check | ✅ | |
| tests/unit/helpers/run-cli.ts | `runCommand` for non-Node executables (git) | ✅ | |
| **T10 — Implement the redaction helper and the failure message builders** | Done when: TC-000-33 to TC-000-35 pass (3 tests) | ✅ | |
| tests/unit/security/redaction.test.ts | TC-000-33: passwords and token redacted (plain and URL-encoded) · TC-000-34: emails are not secrets · TC-000-35: no failure message contains an email | ✅ | |
| src/security/redact.ts | Sensitive-value list and `[REDACTED]` replacement | ✅ | |
| src/errors/messages.ts | Failure messages for RF-17, RF-53, RF-55, RF-56, RF-57 (variable names, never values) | ✅ | |
| **T11 — Implement the TEST_ data factory** | Done when: TC-000-66 to TC-000-68 pass (3 tests) | ✅ | |
| tests/unit/data/test-data-factory.test.ts | TC-000-66: TEST_ prefix · TC-000-67: 10,000 values across 4 workers are unique and prefixed · TC-000-68: same-millisecond values still differ | ✅ | |
| src/data/test-data-factory.ts | `uniqueValue(base, workerId, clock)` → `TEST_<base>_w<worker>_<timestamp>_<sequence><runSuffix>` | ✅ | |
| **T12 — Add the login URL builder and the time budget constants** | Done when: TC-000-77 passes | ✅ | |
| tests/unit/smoke/login-url.test.ts | TC-000-77: BASE_URL with or without a trailing slash gives the same `/#/auth/login` URL | ✅ | |
| src/config/urls.ts | `joinUrl`, `buildLoginUrl` (RF-52), `buildAuthLoginUrl` (RF-54) | ✅ | |
| src/config/timeouts.ts | `NAVIGATION_TIMEOUT_MS` and `API_TIMEOUT_MS` = 30,000 ms | ✅ | |
| **T13 — Implement the login response checks, the schema and AuthClient** | Done when: TC-000-81 to TC-000-85 pass (5 tests) | ✅ | |
| tests/unit/smoke/login-response.test.ts | TC-000-81: 401/429/500 name TEST_USER_EMAIL, never the email · TC-000-82: HTML body → no-valid-token message · TC-000-83: empty/null/missing/non-string token fails · TC-000-84: ECONNREFUSED/ENOTFOUND/timeout classified · TC-000-85: 30 s budget sent with the request | ✅ | |
| src/api/auth-client.ts | `AuthClient.login()`: `POST {API_BASE_URL}/auth/login` with a 30 s timeout; returns the token or a precise failure | ✅ | |
| src/api/login-response.ts | `assertLoginResponse` (RF-55/56) and `classifyNetworkError` (RF-57) | ✅ | |
| src/api/schemas/login-response.schema.ts | zod contract `{ token: non-empty string }` | ✅ | |
| **T14 — Build the Playwright config: projects, reporters, retries and tracing** | Done when: TC-000-40, TC-000-69, TC-000-71 and TC-000-72 pass (4 tests) | ✅ | |
| tests/unit/reporting/reporters.test.ts | TC-000-69: HTML to `playwright-report/`, JUnit to `reports/junit.xml` · TC-000-71: CI=true → 2 retries · TC-000-72: CI unset/false → 0 retries | ✅ | |
| tests/unit/reporting/tracing.test.ts | TC-000-40: `api` trace off; chromium/firefox/webkit/msedge trace on-first-retry | ✅ | |
| src/config/playwright-options.ts | Pure `buildPlaywrightConfig(env, argv)`: projects (api + 3 browsers, msedge on request), reporters, retries, tracing | ✅ | |
| playwright.config.ts | Thin wrapper: `defineConfig(buildPlaywrightConfig(loadEnv(), process.argv))` | ✅ | |
| **T15 — Create LoginPage, the Playwright fixtures and the UI sanity test** | Done when: TC-000-76 passes on chromium, firefox and webkit; locator names verified on the live page | ✅ | |
| tests/ui/login-page.spec.ts | TC-000-76 (`@smoke @regression @ui @critical`): email input, password input and Login button visible on the real login page — 3/3 browsers | ✅ | |
| src/pages/login-page.ts | LoginPage: role-based locators; `open()` throws the RF-53 message on HTTP ≥ 400 or timeout | ✅ | |
| src/pages/login-page.constants.ts | Accessible names verified on the live page | ✅ | |
| src/fixtures/test.ts | Playwright fixture `loginPage` (reads BASE_URL inside the fixture) | ✅ | |
| **T16 — Add the mocked unavailable and timeout login page tests** | Done when: `npx playwright test tests/mocked/login-page-unavailable.spec.ts --project=chromium` passes (2 tests) | ✅ | |
| tests/mocked/login-page-unavailable.spec.ts | TC-000-78: mocked 503 → "Login page unavailable: <URL> (503)" · TC-000-79: request never answered → "(timeout)"; budget constant = 30,000 ms | ✅ | |
| **T17 — Add the API sanity test with account A** | Done when: `npx playwright test tests/api/auth-login.spec.ts --project=api` passes and no trace or body attachment exists for it | ✅ | |
| tests/api/auth-login.spec.ts | TC-000-80 (`@smoke @regression @api @critical`): real `POST /auth/login` with account A returns 200 and a non-empty token | ✅ | |
| src/fixtures/test.ts | Fixtures `authClient` (Playwright `request` + API_BASE_URL) and `accountA` (TEST_USER_EMAIL / TEST_USER_PASSWORD) | ✅ | |
| **T18 — Stop the run on invalid base URLs** | Done when: TC-000-26 and TC-000-27 pass (2 tests) | ✅ | |
| tests/unit/config/base-url-validation.test.ts | TC-000-26: valid http/https URLs → `--list` exits 0 and lists tests · TC-000-27: unset, empty, blank, schemeless and ftp values of BASE_URL and API_BASE_URL (10 runs) stop the run naming the variable, with no test listed | ✅ | |
| src/config/env.ts | `validateBaseUrls(env)` (RF-16) | ✅ | |
| src/errors/messages.ts | `invalidBaseUrlMessage(name)` | ✅ | |
| playwright.config.ts | Validates the base URLs when the config loads, before any test is collected | ✅ | |
| tests/unit/helpers/run-cli.ts | `runPlaywright(args)`: real Playwright CLI with the repository config, from an empty cwd | ✅ | |
| **T19 — Verify project selection, msedge opt-in and the single api run** | Done when: TC-000-14 to TC-000-19 pass (6 tests) | ✅ | |
| tests/unit/playwright/projects.test.ts | TC-000-14: each browser lists the UI test, never the API test · TC-000-15: unknown project rejected · TC-000-16: msedge listed when requested · TC-000-17: default run = api + 3 browsers, no msedge · TC-000-18: one project selected → only that one · TC-000-19: API test listed once, under `api` | ✅ | |
| **T20 — Verify tag selection with --grep** | Done when: TC-000-20 and TC-000-21 pass (2 tests) | ✅ | |
| tests/unit/playwright/projects.test.ts | TC-000-20: `--grep @smoke` selects only TC-000-76 and TC-000-80 (mocked tests excluded) · TC-000-21: an unused tag fails with "No tests found" | ✅ | |
| **T21 — Verify a missing credential fails only the test that reads it** | Done when: TC-000-28 passes | ✅ | |
| tests/unit/config/credential-isolation.test.ts | TC-000-28: TEST_USER_EMAIL unset / empty / blank → only the test using `accountA` fails, with "Missing required environment variable: TEST_USER_EMAIL"; the other test passes | ✅ | |
| tests/fixtures/playwright/two-tests/ | Fixture Playwright project (no browser): one test reads account A, one reads nothing | ✅ | |
| **T22 — Verify reports on failure and traces on the first retry** | Done when: TC-000-70 and TC-000-41 pass (2 tests) | ✅ | |
| tests/unit/reporting/reporters.test.ts | TC-000-70: a failing run still writes `playwright-report/index.html` and `reports/junit.xml` with 1 failure | ✅ | |
| tests/unit/reporting/tracing.test.ts | TC-000-41: with retries, exactly one trace, kept for the retried UI test (`retry1`) although the retry passed; none for api or the stable UI test | ✅ | |
| tests/fixtures/playwright/failing/, retry-trace/ | Fixture projects that use the REAL config builder (only tests folder and output root change) | ✅ | |
| src/config/playwright-options.ts | Optional `BuildOptions { testsDir, outputDir }` so fixture runs write to a temp folder; real run ignores `tests/fixtures/` (defect found and fixed) | ✅ | |
| tests/unit/playwright/projects.test.ts | TC-000-17 guard: the real run collects no test from `tests/fixtures/` | ✅ | |
| **T23 — Mark flaky tests and print the flaky count** | Done when: TC-000-73 to TC-000-75 pass (3 tests); JUnit flaky representation verified | ✅ | |
| tests/unit/reporting/flaky.test.ts | TC-000-73: a test passing on retry is flaky in the HTML report and has a `flaky` property in JUnit · TC-000-74: a stable test has no flaky mark and the summary prints "Flaky tests: 0" · TC-000-75: the summary prints "Flaky tests: 1" for 1 flaky of 3 | ✅ | |
| src/fixtures/test.ts | Automatic `markFlaky` fixture: annotates a test that passed on a retry | ✅ | |
| src/config/playwright-options.ts | JUnit reporter with `embedAnnotationsAsProperties: true` | ✅ | |
| scripts/flaky-summary.ts | `flakySummary()` + CLI (`npm run report:flaky`) reading `reports/results.json` | ✅ | |
| scripts/lib/zip-reader.ts | Minimal zip reader (stored/deflate) on node:zlib; brought forward from T28 to read the HTML report payload | ✅ | |
| tsconfig.scripts.json + package.json | `build:scripts` (tsc → dist/) and `report:flaky` scripts | ✅ | |
| tests/fixtures/playwright/flaky/, stable/; tests/fixtures/reports/one-flaky-of-three.json | Fixture projects (real builder + real fixtures) and a results file | ✅ | |
| **T24 — Implement the spec:check parsers, title scanner and title rule** | Done when: TC-000-50, TC-000-51, TC-000-52 and TC-000-65 pass (4 tests) | ✅ | |
| tests/unit/spec-check/spec-check.test.ts | TC-000-50: valid fixture passes · TC-000-51: titles without TC ID, malformed ID, ID only in describe → each named · TC-000-52: TC referencing RF-99 named · TC-000-65: empty specs/ → "No specs found", exit 0 | ✅ | |
| tests/unit/spec-check/spec-check-fixture.ts | Copies the valid fixture repository to a temp folder and edits it per test | ✅ | |
| tests/fixtures/spec-check/valid/ | Fixture repository: spec 900 (3 RFs), test-cases (2 automated, 1 manual), one Vitest and one Playwright test | ✅ | |
| scripts/spec-check/parse-spec.ts, parse-test-cases.ts | Read status and RFs from spec.md; ID, Requirement and Automate from test-cases.md | ✅ | |
| scripts/spec-check/scan-titles.ts | Test declarations via the TypeScript compiler API (titles, skip/fixme, describe scope) | ✅ | |
| scripts/spec-check/rules.ts, run.ts + package.json | Rules RF-31/RF-32, runner and `npm run spec:check` CLI | ✅ | |
| **T25 — Add the spec:check rules for missing, duplicate, unknown and skipped tests** | Done when: TC-000-53 to TC-000-57 pass (5 tests) | ✅ | |
| tests/unit/spec-check/spec-check.test.ts | TC-000-53: Automate Y TC without test named · TC-000-54: skipped test → warning, exit 0, status `skipped` · TC-000-55: duplicate TC ID names both tests · TC-000-56: TC defined twice names TC and file · TC-000-57: TC ID of a nonexistent spec named | ✅ | |
| scripts/spec-check/rules.ts | Rules RF-33 to RF-37 and traceability statuses (automated / skipped / manual / missing) | ✅ | |
| scripts/spec-check/run.ts | Result now carries the traceability rows | ✅ | |
| **T26 — Add the spec:check rules that depend on spec status** | Done when: TC-000-61 to TC-000-64 pass (4 tests) | ✅ | |
| tests/unit/spec-check/spec-check.test.ts | TC-000-61: draft/approved specs without test-cases pass · TC-000-62: test-cases-approved spec without test-cases.md fails naming it · TC-000-63: RF without TC after approval fails naming it · TC-000-64: orphan RF not checked before approval | ✅ | |
| tests/unit/spec-check/spec-check-fixture.ts | `specFile()` and `manualTestCasesFile()` builders | ✅ | |
| scripts/spec-check/rules.ts | Rules RF-38 and RF-39 (status from `test-cases-approved` on) | ✅ | |
| **T27 — Add spec:check --write for the traceability matrix** | Done when: TC-000-58 to TC-000-60 pass (3 tests) | ✅ | |
| tests/unit/spec-check/spec-check-write.test.ts | TC-000-58: `--write` creates the matrix with automated / skipped / manual / missing rows (written even with violations; run fails) · TC-000-59: without `--write` the file is byte-identical · TC-000-60: read-only file → non-zero exit naming `docs/traceability.md` and the OS reason | ✅ | |
| scripts/spec-check/write-matrix.ts | `renderMatrix` (sorted rows) and `writeMatrix` (returns the OS error instead of throwing) | ✅ | |
| scripts/spec-check/run.ts | `--write` handling and `TRACEABILITY_FILE` | ✅ | |
| **T28 — Implement the zip reader and check:secrets** | Done when: TC-000-38 and TC-000-39 pass (2 tests) | ✅ | |
| tests/unit/security/check-secrets.test.ts | TC-000-38: clean report, JUnit and trace zip → exit 0 · TC-000-39: password inside a trace zip, URL-encoded in HTML and inside the HTML report's embedded zip, plus a JWT-shaped token → each named by file and variable; output never contains a value | ✅ | |
| scripts/check-secrets.ts + package.json | `scanArtifacts()` and `npm run check:secrets`: passwords (plain + URL-encoded) and JWT-shaped tokens, inside zips and embedded base64 zips | ✅ | |
| scripts/lib/zip-reader.ts | REUSED from T23 | ✅ | |
| tests/unit/helpers/make-zip.ts | Builds deflated zip fixtures at test time (no binary files in git) | ✅ | |
| **T29 — Implement the Playwright image version check** | Done when: TC-000-05 passes (TC-000-04 is completed in T32) | ✅ | |
| tests/unit/ci/playwright-image-version.test.ts | TC-000-05: image `v1.40.0-jammy` vs installed `1.48.0` → mismatch message naming both versions | ✅ | |
| scripts/lib/playwright-version.ts | `playwrightImages`, `lockedPlaywrightVersion`, `checkImageVersion` | ✅ | |
| **T30 — Implement the manual-run suite selector** | Done when: TC-000-90 to TC-000-92 pass (3 tests) | ✅ | |
| tests/unit/ci/ci-run-suite.test.ts | TC-000-90: 8 SUITE × BROWSER combinations → right `--grep` and projects, api once · TC-000-91: msedge / empty / `Smoke` / unknown rejected naming the variable and allowed values · TC-000-92: zero selected tests → "No tests found for SUITE=regression", Playwright not run | ✅ | |
| scripts/ci-run-suite.ts + package.json | `selectRun`, `runSuite`, `countListedTests` and `npm run ci:run-suite` | ✅ | |
| **T31 — Implement the CI script check for environment printing** | Done when: TC-000-95 passes | ✅ | |
| tests/unit/ci/gitlab-ci.test.ts | TC-000-95: `printenv`, `env | sort`, `set -x` → 3 findings with command and line; `environment:` and `$CI_ENVIRONMENT_NAME` not flagged | ✅ | |
| scripts/check-ci-scripts.ts | `findEnvPrinting(content, file)`: printenv, bare env, set -x (combined flags too), export -p, declare -p/-x | ✅ | |
| tests/fixtures/ci/print-env/.gitlab-ci.yml | CI definition fixture that prints the environment three ways | ✅ | |
| **T32 — Write the eyter_dev GitLab pipeline** | Done when: TC-000-04, 05, 86, 87 and 95 pass (5 tests); Node of the Playwright image recorded | ✅ | |
| tests/unit/ci/gitlab-ci.test.ts | TC-000-86: gate jobs, check:secrets after each Playwright job, JUnit, artifacts (`when: always`, 7 days), flaky count, no env printing · TC-000-87: push gates target eyter_dev only · TC-000-04: image version = locked @playwright/test (1.63.0) | ✅ | |
| .gitlab-ci.yml | eyter_dev gate (check → smoke → scan) and manual run (SUITE/BROWSER); Playwright 1.63.0 image | ✅ | |
| specs/000-framework-foundation/spec.md (Mode C) | NFR: CI uses the Node of the Playwright image (24); @types/node in the dependency list — approved by the user | ✅ | |
| specs/000-framework-foundation/test-cases.md (Mode C) + tests/unit/spec-check/spec-check-write.test.ts | TC-000-60 test data: unwritable target is a folder (works as root in CI) — approved by the user | ✅ | |
| **T33 — Document setup and run the full local gate** | Done when: lint, typecheck, test:unit and spec:check exit 0; `--write` has no `missing` row; smoke passes; check:secrets exits 0 | ✅ | |
| README.md | Setup (npm ci, .env), commands table, reports, account A recovery, `CI=true` locally, Windows/Volta note, CI/CD summary | ✅ | |
| docs/traceability.md | Regenerated: 140 rows (TC × RF), 67 RFs, 126 automated, 14 manual, 0 missing | ✅ | |
| **Fix after pipeline #2924882205** | unit job failed in CI: TC-000-41 could not find browsers (PLAYWRIGHT_BROWSERS_PATH not passed to child processes) | | ❌ |
| tests/unit/helpers/run-cli.ts | PLAYWRIGHT_BROWSERS_PATH added to the child-process allowlist; verified locally and in CI pipeline #2924894818 (unit 83/83) | ✅ | |
| **CI pipeline #2924894818 (eyter_dev, 626998f)** | All 8 jobs green: spec-check, lint, typecheck, unit (83/83), smoke-api (1/1), smoke-ui-chromium (1/1), check-secrets-api, check-secrets-ui-chromium; Tests tab 2/2; Flaky tests: 0 | ✅ | |
| **Change after validation: RF-33 / RF-68 (Mode C, approved)** | Missing tests are warnings until a spec is implemented, so the pipeline stays usable while Spec 001 is built | ✅ | |
| specs/000-framework-foundation/spec.md + test-cases.md | RF-33 limited to `implemented` or later; RF-68 added; TC-000-53 updated; TC-000-96 added; TC-000-58 test data | ✅ | |
| scripts/spec-check/rules.ts | Missing test → warning before `implemented`, error from `implemented` on | ✅ | |
| tests/unit/spec-check/spec-check.test.ts | TC-000-53 (implemented spec fails) · TC-000-96 (warning, exit 0, status `missing`) | ✅ | |
| tests/unit/spec-check/spec-check-write.test.ts | TC-000-58 fixture spec set to `implemented` | ✅ | |
| docs/traceability.md | Regenerated: 225 rows (Spec 000 and Spec 001) | ✅ | |
| **Change after validation: automatic promotion (Mode C, approved)** | eyter_dev → release → main → production; any failed job stops the chain | ✅ | |
| specs/000-framework-foundation/spec.md + test-cases.md | RF-31 (TC IDs with 2+ digits), RF-59 generalized, RF-69 to RF-77; TC-000-86/87 updated; TC-000-97 to 110 added | ✅ | |
| scripts/spec-check/rules.ts + parse-test-cases.ts | TC-000-97: `TC-900-100` accepted, `TC-900-1` rejected | ✅ | |
| scripts/ci-promote.ts + tests/unit/ci/ci-promote.test.ts | TC-000-102 to 108: next branch, MR create/reuse, merge pinned to SHA keeping the source branch, up to date, SHA moved, not mergeable/conflict, missing token | ✅ | |
| .gitlab-ci.yml + tests/unit/ci/gitlab-ci.test.ts | TC-000-86, 87, 98 to 101: check jobs on all branches, release/main/production gates, promote last with `when: on_success`, no allow_failure, no force push | ✅ | |
| README.md, package.json | CI/CD gate table, `PROMOTION_TOKEN` setup, `npm run ci:promote` | ✅ | |
| TC-000-109 (manual, live) | Green chain: eyter_dev 2925606874 → MR !4 → release 2925619862 → MR !5 → main 2925638938 → MR !6 → production 2925654814; source branches kept | ✅ | |
| TC-000-110 (manual, live) | Pending: a failing job stops the chain (next natural failure or an approved failing commit) | | |

## Last full run
| Command | Result | Passed | Failed |
|---------|--------|:------:|:------:|
| `npm run test:unit` | 96 passed · 0 failed | ✅ | |
| `npm run typecheck` | exit 0 | ✅ | |
| `npm run lint` | 0 problems | ✅ | |
| `npm run spec:check` | passed (2 specs) — 0 errors; 40 warnings for Spec 001 TCs not implemented yet (RF-68) | ✅ |  |
| `npx playwright test` | 10 passed · 0 failed (api + chromium + firefox + webkit) | ✅ | |
| `npx playwright test --grep @smoke --project=api --project=chromium` | 2 passed · 0 failed (real site and API) | ✅ | |
| `ci:run-suite selection, real listing (chromium)` | smoke → 2 tests · regression → 4 tests | ✅ | |
| `npm run check:secrets` | passed: no sensitive value in the run's artifacts | ✅ | |
| `npm run report:flaky` | Flaky tests: 0 | ✅ | |
| `npx playwright test tests/api/auth-login.spec.ts --project=api` | 1 passed · 0 failed; no trace, no attachment, 0 password matches in reports | ✅ | |
| `npx playwright test tests/mocked/login-page-unavailable.spec.ts --project=chromium` | 2 passed · 0 failed | ✅ | |
| `npx playwright test tests/ui/login-page.spec.ts --project=chromium --project=firefox --project=webkit` | 3 passed · 0 failed | ✅ | |

## Change after validation: GitHub only (2026-10-09)
| Command | Result | Passed | Failed |
|---------|--------|:------:|:------:|
| `npm run test:unit -- tests/unit/ci` | 22 passed · 0 failed | ✅ | |
| `npm run test:unit` | 103 passed · 0 failed (26 files) | ✅ | |
| `npm run typecheck` | exit 0 | ✅ | |
| `npm run lint` | 0 errors (10 pre-existing warnings in tests/api) | ✅ | |
| `npm run spec:check -- --write` | passed (5 specs) | ✅ | |
| Workflow mutations (4, reverted) | each caught by TC-000-86 or TC-000-101 | ✅ | |
| GitHub run 37918960715 (before the fix) | `checks (test:unit)` failed on TC-000-30 (git exit 128 in the container) | | ❌ |
| GitHub runs for `83ba6e7`: eyter_dev 37925874939, release 37926325361, main 37929397499, production 37930026405 | all green; promoted up to production; production did not promote | ✅ | |

## Change after validation: staged jobs, test summaries and results page (clarifications 15 to 17)
| Task / File | Purpose | Passed | Failed |
|-------------|---------|:------:|:------:|
| **T34 — Split the workflow into chained stage jobs** | Done when: `npm run test:unit -- tests/unit/ci` passes | ✅ | |
| .github/workflows/ci.yml | checks (spec:check, lint, typecheck; `fail-fast: true`) → unit-tests → `<branch>-api` → `<branch>-ui-chromium` → firefox → webkit (release, main); `run-suite` and every API job need `unit-tests`; `promote` needs all 15 other jobs | ✅ | |
| tests/unit/ci/github-actions.test.ts | TC-000-86, 87, 98, 99, 100, 101, 114, 115, 116 updated to the new jobs; TC-000-119 new (exact `needs` chain, `fail-fast`, no `always()` outside `promote`) | ✅ | |
| `npm run test:unit -- tests/unit/ci` | 23 passed · 0 failed (4 files) | ✅ | |
| `npm run test:unit` | 104 passed · 0 failed (26 files) | ✅ | |
| `npm run typecheck` / `npm run lint` | exit 0 / 0 errors (10 pre-existing warnings in tests/api) | ✅ | |
| Workflow mutations (3, reverted) | firefox needing the API job, `fail-fast: false`, `always()` on a UI job: each caught by TC-000-98 or TC-000-119 | ✅ | |
| `npm run spec:check` | 15 errors expected: TC-000-120 to 132, 134, 135 belong to T35 to T41 (not pushed until they are done) | | ❌ |
| **T35 — Implement the test summary script** | Done when: `npx vitest run tests/unit/reporting/test-summary.test.ts` passes (5 tests) | ✅ | |
| scripts/test-summary.ts, package.json (`report:summary`) | Playwright or Vitest JSON → table (passed incl. flaky, failed, skipped, flaky, total, mm:ss), failed titles capped at 50, `reports/summary.json`, GITHUB_STEP_SUMMARY append; missing file → "Results unknown", exit 0 | ✅ | |
| tests/unit/reporting/test-summary.test.ts, tests/fixtures/reports/summary/ | TC-000-120, 121, 122, 125, 135 — 5 passed | ✅ | |
| **T36 — Add unit-test code coverage** | Done when: TC-000-123 and 124 pass and `npm run test:unit:ci` writes the results and the coverage summary | ✅ | |
| package.json, package-lock.json | `@vitest/coverage-v8` 4.1.11 (exact, = installed vitest; approved in clarification 16); `test:unit:ci` | ✅ | |
| vitest.config.mts | coverage v8 of `src/**` and `scripts/**`, `text` + `json-summary` + `html` into `reports/coverage`, `reportOnFailure: true`, no thresholds | ✅ | |
| scripts/test-summary.ts | `--coverage <file>` adds the Lines / Branches / Functions / Statements table and `coverage` in summary.json | ✅ | |
| tests/unit/reporting/unit-coverage.test.ts | TC-000-123, TC-000-124 — 2 passed | ✅ | |
| `npm run test:unit:ci` (real run) | 111 passed · 0 failed (28 files) in 00:58; coverage lines 52.43 %, branches 54.54 %, functions 39.49 %, statements 51.97 % | ✅ | |
| **T37 — Add spec:check --summary** | Done when: `npx vitest run tests/unit/spec-check/spec-check-summary.test.ts` passes | ✅ | |
| scripts/spec-check/summary.ts, scripts/spec-check/run.ts | `--summary`: per spec RFs, TCs (each counted once), automated / manual / skipped / missing, automated % over all TCs (— without TCs); printed, appended to GITHUB_STEP_SUMMARY, saved to `reports/summary.json`; exit code unchanged | ✅ | |
| tests/unit/spec-check/spec-check-summary.test.ts | TC-000-126 — 1 passed; spec-check folder 19 passed | ✅ | |
| `npm run spec:check -- --summary` (repository) | 000: 89 RFs, 132 TCs, 112 automated, 13 manual, 7 missing (T38 to T41), 85 % · 001: 98 % · 002, 003, 004: 100 % | ✅ | |
| **T38 — Wire the summaries into the workflow** | Done when: `npm run test:unit -- tests/unit/ci` passes | ✅ | |
| .github/workflows/ci.yml | spec:check leg runs `-- --summary` (matrix `include`), scans and uploads `summary-checks`; `unit-tests` runs `test:unit:ci`, `report:summary` with results + coverage, scan, uploads `reports/` and `summary-unit-tests`; every Playwright and manual job runs `report:summary` (`if: always()`) before `check:secrets` and uploads `summary-<job>` only after a clean scan | ✅ | |
| tests/unit/ci/github-actions.test.ts | TC-000-127 — CI tests 24 passed | ✅ | |
| Workflow mutations (2, reverted) | summary upload without the scan condition, unit summary without coverage: both caught by TC-000-127 | ✅ | |
| **T39 — Implement the results page builder** | Done when: `npx vitest run tests/unit/reporting/results-page.test.ts` passes (4 tests) | ✅ | |
| scripts/results-page.ts, package.json (`report:pages`) | Reads the published results.json (404 → first publication; other failure → exit 1, nothing written), builds this branch's entry from `NEEDS_JSON` job results and `summary-<job>` artifacts (stages in chain order, "not run" when skipped, `passed` only when every stage passed, UTC ISO date), keeps the other branches, writes escaped HTML without scripts + results.json | ✅ | |
| tests/unit/reporting/results-page.test.ts, tests/fixtures/reports/pages/ | TC-000-128, 129, 131, 134 — 4 passed (stub fetcher, no network) | ✅ | |
| Local run of `dist/scripts/results-page.js` with real summaries | first publication (real 404), `reports/pages/index.html` + `results.json` written; `check:secrets` passed (85 files) | ✅ | |
| **T40 — Add the publish-results job** | Done when: `npm run test:unit -- tests/unit/ci` passes | ✅ | |
| .github/workflows/ci.yml | `publish-results`: `always()` on push only, needs the 14 test jobs, `NEEDS_JSON: ${{ toJSON(needs) }}`, job-level `pages: write` + `id-token: write`, environment `github-pages`, concurrency `pages`; download `summary-*` → `report:pages` → `check:secrets` → upload-pages-artifact → deploy-pages; `promote` also needs it | ✅ | |
| tests/unit/ci/github-actions.test.ts | TC-000-130 new, TC-000-119 updated (only publish-results uses `always()`) — CI tests 25 passed | ✅ | |
| Workflow mutations (3, reverted) | deploy before the scan and publishing from manual runs: caught at once; top-level `pages: write`: first missed, TC-000-130 strengthened (top-level permissions must be exactly `contents: read`), then caught | ✅ | |
| **T41 — Publish results and the manual-testing guide in the README** | Done when: `npx vitest run tests/unit/docs/readme.test.ts` passes; lint, typecheck, test:unit and spec:check exit 0 | ✅ | |
| README.md | "Test results" (4 CI badges + results page link), "Running tests manually" (local commands for unit, coverage, API, UI per browser, smoke, regression; `gh workflow run ci.yml --ref <branch>` table for the 4 branches), CI/CD section with the job chains, summaries, results page and the Pages setup | ✅ | |
| AGENTS.md, docs/test-plan.md | Commands and CI table updated (§6 stage order, §10 summaries and results page) | ✅ | |
| tests/unit/docs/readme.test.ts | TC-000-132 — 1 passed | ✅ | |

### Last full run (after T41)
| Command | Result | Passed | Failed |
|---------|--------|:------:|:------:|
| `npm run test:unit` | 119 passed · 0 failed (31 files) | ✅ | |
| `npm run test:unit -- tests/unit/ci` | 25 passed · 0 failed | ✅ | |
| `npm run typecheck` / `npm run lint` | exit 0 / 0 errors (10 pre-existing warnings in tests/api) | ✅ | |
| `npm run spec:check -- --write` | passed (5 specs); docs/traceability.md 458 rows | ✅ | |
| `npx playwright test --grep @smoke --project=api --project=chromium` | 11 passed · 0 failed (real site); `report:summary` on its JSON: 11 / 0 / 0 / 0, 00:18 | ✅ | |
| `npm run check:secrets` | passed (81 files) | ✅ | |
| Manual TCs TC-000-110, 118, 133, 136 | Pending: executed at validation; TC-000-136 before the repository is made public | | |
