# Execution Report — Spec 000 Framework foundation

Spec: specs/000-framework-foundation/spec.md · Tasks: specs/000-framework-foundation/tasks.md ·
Log: specs/000-framework-foundation/implementation.md

This report is updated each time a task is completed. A task row reflects the task's
`Done when:` command; a file row reflects the tests that exercise that file.

Legend: ✅ = passed · ❌ = failed

## Summary
| Tasks completed | Passed | Failed |
|-----------------|--------|--------|
| 33 / 33 | ✅ 33 | ❌ 0 |

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

## Last full run
| Command | Result | Passed | Failed |
|---------|--------|:------:|:------:|
| `npm run test:unit` | 83 passed · 0 failed | ✅ | |
| `npm run typecheck` | exit 0 | ✅ | |
| `npm run lint` | 0 problems | ✅ | |
| `npm run spec:check` | passed (1 spec) — 0 errors; `--write` 0 missing rows | ✅ |  |
| `npx playwright test` | 10 passed · 0 failed (api + chromium + firefox + webkit) | ✅ | |
| `npx playwright test --grep @smoke --project=api --project=chromium` | 2 passed · 0 failed (real site and API) | ✅ | |
| `ci:run-suite selection, real listing (chromium)` | smoke → 2 tests · regression → 4 tests | ✅ | |
| `npm run check:secrets` | passed: no sensitive value in the run's artifacts | ✅ | |
| `npm run report:flaky` | Flaky tests: 0 | ✅ | |
| `npx playwright test tests/api/auth-login.spec.ts --project=api` | 1 passed · 0 failed; no trace, no attachment, 0 password matches in reports | ✅ | |
| `npx playwright test tests/mocked/login-page-unavailable.spec.ts --project=chromium` | 2 passed · 0 failed | ✅ | |
| `npx playwright test tests/ui/login-page.spec.ts --project=chromium --project=firefox --project=webkit` | 3 passed · 0 failed | ✅ | |
