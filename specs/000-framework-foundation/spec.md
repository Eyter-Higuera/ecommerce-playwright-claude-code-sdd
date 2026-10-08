# Spec 000 — Framework foundation

Status: validated
<!-- Allowed values: draft | approved | test-cases-approved | implemented | validated -->
Source: interview

## Context and goal
Later specs (auth, catalog, cart, checkout, orders) need a common, reliable base to automate the
third-party demo shop at https://rahulshettyacademy.com/client and its REST API. This spec defines
that base: project setup, configuration and secrets handling, lint rules, the SDD traceability
gate, test data generation, reporting, two sanity smoke tests and the first CI stage on
`eyter_dev`. It contains no business tests. Spec 000 tests create no data on the target site; the
cleanup obligation (constitution #5) applies from the first spec that creates data.

## Users / actors
- QA automation engineer (writes and runs tests locally).
- GitLab CI/CD pipeline (runs the gates on `eyter_dev`).

## User stories
- US-1: As a QA automation engineer I want a ready-to-use test framework so that the next specs
  can be automated, run locally and in GitLab CI/CD in a consistent and traceable way.

## Requirements summary
Overview of the functional requirements below, grouped by block (navigation aid only; the EARS
requirements are the source of truth).

| Block | Requirements | Content | Test cases |
|---|---|---|---|
| Setup | RF-1 to RF-4 | One-command install (deps + 3 browsers), CI image = installed Playwright, Node ≥ 20 enforced, strict typecheck | TC-000-01 npm ci installs dependencies and three browsers in one command (manual)<br>TC-000-02 npm ci on Node 18 fails naming the required Node version (manual)<br>TC-000-03 package manifest enforces Node 20 or later<br>TC-000-04 CI Playwright image version equals installed @playwright/test version<br>TC-000-05 CI image version check reports a mismatch naming both versions<br>TC-000-06 typecheck passes on the repository code<br>TC-000-07 typecheck fails on a strict-mode type error |
| Unit tests | RF-5 to RF-7 | Vitest exit codes, outbound network blocked, no env variables needed | TC-000-08 test:unit exits 0 when all unit tests pass<br>TC-000-09 test:unit exits non-zero when a unit test fails<br>TC-000-10 unit test with a mocked HTTP dependency makes no network request<br>TC-000-11 unit test sending a real request fails, localhost included<br>TC-000-12 unit suite runs with no environment variables and no .env file<br>TC-000-13 reading a credential in a unit context raises the missing-variable error |
| Browsers, projects and suites | RF-8 to RF-12 | chromium/firefox/webkit, msedge only on request, default projects, api project once, `@smoke` grep | TC-000-14 each browser project lists the UI tests and no API test<br>TC-000-15 an unknown browser project is rejected<br>TC-000-16 msedge project runs only when explicitly requested<br>TC-000-17 a run without --project includes api and three browsers but not msedge<br>TC-000-18 selecting one project does not run the other default projects<br>TC-000-19 API tests run once, in the api project only<br>TC-000-20 --grep @smoke selects only smoke tests<br>TC-000-21 --grep with an unused tag finds no tests |
| Configuration | RF-13 to RF-19 | Six variables, `.env` loading, process precedence, base URL validation, missing-credential message, `.env.example` and drift check | TC-000-12 unit suite runs with no environment variables and no .env file<br>TC-000-22 configuration accessor returns all six variables<br>TC-000-23 .env file values are loaded when present<br>TC-000-24 process environment takes precedence over .env<br>TC-000-25 empty process value overrides a .env value and is reported missing<br>TC-000-26 valid base URLs let the Playwright run start<br>TC-000-27 missing or malformed base URL stops the run before any test<br>TC-000-28 missing credential fails only the test that reads it<br>TC-000-29 .env.example lists the six variables with placeholders only<br>TC-000-30 .env is ignored by git while .env.example is tracked<br>TC-000-31 .env.example in sync with RF-13 passes<br>TC-000-32 .env.example drift fails naming the variable |
| Sensitive values | RF-20 to RF-26 | Passwords and token are secrets, emails not printed, nothing sensitive in outputs, `check:secrets`, api tracing off, no body attachments | TC-000-33 passwords and auth token are redacted as sensitive values<br>TC-000-34 emails are not classified as sensitive values<br>TC-000-35 framework failure messages never contain email values<br>TC-000-36 failing smoke run leaks no email or password to console or artifacts (manual)<br>TC-000-37 smoke artifacts pass the secrets scan in every pipeline (manual)<br>TC-000-38 secrets scan passes on clean artifacts<br>TC-000-39 secrets scan finds values inside trace archives and URL-encoded<br>TC-000-40 tracing is off for api and on-first-retry for UI projects<br>TC-000-41 retried runs keep UI traces and record none for api |
| Lint | RF-27 to RF-30 | No `waitForTimeout`, awaited Playwright calls, one test framework per file, lint scope | TC-000-42 lint passes code without waitForTimeout<br>TC-000-43 lint rejects waitForTimeout<br>TC-000-44 lint passes awaited Playwright calls<br>TC-000-45 lint rejects each kind of unawaited Playwright promise<br>TC-000-46 lint accepts files with a single test framework import<br>TC-000-47 lint rejects mixed Playwright and Vitest imports<br>TC-000-48 lint covers source, tests, scripts and root config<br>TC-000-49 lint ignores generated folders |
| Traceability gate | RF-31 to RF-43, RF-68 | spec:check rules (TC IDs, RFs, missing/duplicate/unknown/skipped tests, status-based rules, no specs), `--write` matrix and write failure; missing tests are warnings until the spec is implemented | TC-000-50 spec:check passes a fully traceable fixture<br>TC-000-51 spec:check rejects titles without a valid TC ID<br>TC-000-52 spec:check rejects a TC referencing a nonexistent RF<br>TC-000-53 spec:check fails when an implemented spec has an Automate Y TC without test<br>TC-000-54 a skipped test satisfies its TC and is reported as skipped<br>TC-000-55 spec:check rejects two tests with the same TC ID<br>TC-000-56 spec:check rejects a TC ID defined twice in test-cases.md<br>TC-000-57 spec:check rejects a TC ID of a nonexistent spec<br>TC-000-58 --write creates the traceability file with all four statuses<br>TC-000-59 spec:check without --write leaves the traceability file unchanged<br>TC-000-60 --write fails with a reason when the file cannot be written<br>TC-000-61 specs without test cases pass while draft or approved<br>TC-000-62 spec without test cases fails once test cases are approved<br>TC-000-63 spec:check rejects an RF without TC after test-case approval<br>TC-000-64 orphan RFs are not checked before test-case approval<br>TC-000-65 spec:check with no specs prints No specs found and passes<br>TC-000-96 spec:check warns for an Automate Y TC without test before implementation<br>TC-000-97 spec:check accepts TC IDs with three-digit sequence numbers |
| Test data | RF-44 to RF-45 | `TEST_` prefix, unique values per worker and timestamp | TC-000-66 generated values start with TEST_<br>TC-000-67 10,000 values across 4 workers are unique and all prefixed<br>TC-000-68 values generated in the same millisecond still differ |
| Reporting and retries | RF-46 to RF-51 | HTML + JUnit paths, 2 retries in CI only, trace on first retry, flaky marking and count | TC-000-40 tracing is off for api and on-first-retry for UI projects<br>TC-000-41 retried runs keep UI traces and record none for api<br>TC-000-69 HTML and JUnit reporters write to the agreed paths<br>TC-000-70 reports are produced when a test fails<br>TC-000-71 CI=true enables 2 retries<br>TC-000-72 retries stay off when CI is unset or false<br>TC-000-73 a test passing on retry is marked flaky<br>TC-000-74 stable tests are not flaky and the count is 0<br>TC-000-75 CI flaky summary prints the flaky count |
| Sanity smoke tests | RF-52 to RF-57 | Login page form visible, page unavailable message, API login token, non-200 / no-token / unreachable messages | TC-000-76 login page shows email, password and Login button<br>TC-000-77 login URL has a single slash with or without trailing slash<br>TC-000-78 unavailable login page fails with a clear message<br>TC-000-79 login page timeout fails with a timeout message<br>TC-000-80 API login with account A returns 200 and a token<br>TC-000-81 non-200 login response names the variable, not its value<br>TC-000-82 non-JSON login response fails with the no-valid-token message<br>TC-000-83 empty, null, missing or non-string token fails<br>TC-000-84 unreachable login API fails with the error type and URL<br>TC-000-85 API request budget is 30 seconds |
| CI/CD (eyter_dev and promotion) | RF-58 to RF-67, RF-69 to RF-77 | eyter_dev gates; release, main and production gates; automatic promotion to the next branch on success, stopped by any failure; failing job fails pipeline, SUITE/BROWSER manual runs, invalid values, empty suite, masked/protected variables, no env printing, JUnit report, 7-day artifacts | TC-000-86 CI definition declares the gates, reports and artifacts<br>TC-000-87 each push gate runs only on its own branch<br>TC-000-88 push to eyter_dev runs a green pipeline with test report (manual)<br>TC-000-89 a failing job fails the pipeline and keeps evidence (manual)<br>TC-000-90 SUITE and BROWSER values select the right tests<br>TC-000-91 unsupported SUITE or BROWSER fails naming allowed values<br>TC-000-92 a suite with zero tests fails the pipeline<br>TC-000-93 credential variables are masked and protected in GitLab (manual)<br>TC-000-94 unprotected branch run gets no credentials and leaks nothing (manual)<br>TC-000-95 CI script check flags environment printing<br>TC-000-98 CI definition runs the release gate<br>TC-000-99 CI definition runs the main gate<br>TC-000-100 CI definition runs the production sanity gate<br>TC-000-101 promotion runs last, only on success, and never from web runs or production<br>TC-000-102 the next branch is release, main, production and none after that<br>TC-000-103 promotion creates a merge request and merges the tested commit<br>TC-000-104 promotion reuses an open merge request<br>TC-000-105 promotion passes when the target is already up to date<br>TC-000-106 promotion fails when the source branch moved past the tested commit<br>TC-000-107 promotion fails when the merge request is not mergeable in time<br>TC-000-108 promotion without PROMOTION_TOKEN fails naming the variable<br>TC-000-109 a green eyter_dev push is promoted up to production (manual)<br>TC-000-110 a failing job stops the promotion chain (manual) |

## Functional requirements (acceptance criteria in EARS)

### Setup
- RF-1: WHEN `npm ci` runs locally on a clean checkout with Node 20 or later, THE SYSTEM SHALL install every npm dependency and the chromium, firefox and webkit browser binaries with that single command. Source: interview AC-1
- RF-2: WHILE running in CI, THE SYSTEM SHALL use a Playwright Docker image whose version equals the installed `@playwright/test` version. Source: interview AC-1 (review 2, A-6)
- RF-3: IF the Node major version is lower than 20, THEN THE SYSTEM SHALL fail the installation with a message naming the required version. Source: interview AC-1 (review 1, B-4)
- RF-4: WHEN `npm run typecheck` runs, THE SYSTEM SHALL type-check all framework and test code in TypeScript strict mode and exit non-zero if any type error exists. Source: interview AC-1

### Unit tests
- RF-5: WHEN `npm run test:unit` runs, THE SYSTEM SHALL execute every `*.test.ts` file with Vitest and exit non-zero if any test fails. Source: interview AC-2
- RF-6: IF a unit test sends an outbound HTTP or HTTPS request (localhost included), THEN THE SYSTEM SHALL fail that test with the message "Network access is disabled in unit tests: <url>". Source: interview AC-2
- RF-7: WHILE unit tests run, THE SYSTEM SHALL not require any environment variable. Source: interview AC-4 (clarification 2)

### Browsers, projects and suites
- RF-8: WHEN Playwright runs with `--project=<browser>` where browser is chromium, firefox or webkit, THE SYSTEM SHALL execute the UI tests on that browser, locally and in CI. Source: interview AC-3
- RF-9: THE SYSTEM SHALL run the `msedge` project only when it is explicitly requested with `--project=msedge`. Source: interview AC-3 (clarification 3, review 2 C-2)
- RF-10: WHEN Playwright runs without `--project`, THE SYSTEM SHALL run the `api`, chromium, firefox and webkit projects only. Source: interview AC-3 (review 2, C-2)
- RF-11: THE SYSTEM SHALL run `@api` tests only in a dedicated, browser-independent `api` project, once per run. Source: interview AC-3 (review 1, A-2)
- RF-12: WHEN Playwright runs with `--grep @smoke`, THE SYSTEM SHALL execute only tests tagged `@smoke`. Source: interview AC-3

### Configuration
- RF-13: THE SYSTEM SHALL read BASE_URL, API_BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_2_EMAIL and TEST_USER_2_PASSWORD from environment variables. Source: interview AC-4
- RF-14: WHERE a local `.env` file is present, THE SYSTEM SHALL load the variables of RF-13 from it. Source: interview AC-4
- RF-15: IF a variable of RF-13 is set both in the process environment and in `.env`, THEN THE SYSTEM SHALL use the process environment value. Source: interview AC-4
- RF-16: WHEN a Playwright run starts, IF BASE_URL or API_BASE_URL is missing, empty, whitespace-only or not an absolute `http` or `https` URL, THEN THE SYSTEM SHALL stop the whole run before any test executes, with a message naming the variable. Source: interview AC-4 (review 2, A-1)
- RF-17: IF a test reads, through the configuration accessor, a TEST_USER_* variable that is missing, empty or whitespace-only, THEN THE SYSTEM SHALL fail only that test with the message "Missing required environment variable: <NAME>". Source: interview AC-4 (clarification 2)
- RF-18: THE SYSTEM SHALL provide a committed `.env.example` listing every variable of RF-13 with placeholder values only. Source: interview AC-4
- RF-19: IF `.env.example` is missing a variable of RF-13, or lists a variable that is not in RF-13, THEN THE SYSTEM SHALL fail the unit test suite naming the variable. Source: interview AC-4 (review 2, E-5)

### Sensitive values
- RF-20: THE SYSTEM SHALL treat TEST_USER_PASSWORD, TEST_USER_2_PASSWORD and any auth token returned by the API as sensitive values. Source: constitution #5 (review 2, C-1)
- RF-21: THE SYSTEM SHALL not print TEST_USER_EMAIL or TEST_USER_2_EMAIL to console output or CI logs; these test identifiers may appear in UI screenshots, videos and traces. Source: constitution #5 (review 2, C-1)
- RF-22: THE SYSTEM SHALL not write any sensitive value to console output, the HTML report, the JUnit XML, traces, screenshots, videos or attachments. Source: constitution #5
- RF-23: WHEN `npm run check:secrets` runs, THE SYSTEM SHALL scan `reports/`, `playwright-report/` and `test-results/`, including the contents of trace archives, for the sensitive values in plain and URL-encoded form. Source: constitution #5 (review 2, T-1)
- RF-24: IF `npm run check:secrets` finds a match, THEN THE SYSTEM SHALL exit non-zero naming the file and the variable, never the value; otherwise it SHALL exit with code 0. Source: constitution #5 (review 2, T-1)
- RF-25: THE SYSTEM SHALL disable tracing in the `api` project. Source: constitution #5 (review 1, A-2)
- RF-26: THE SYSTEM SHALL attach no request or response bodies containing sensitive values in `@api` tests. Source: constitution #5 (review 1, A-2)

### Lint
- RF-27: WHEN `npm run lint` runs on code that calls `waitForTimeout`, THE SYSTEM SHALL report an error and exit non-zero. Source: interview AC-5
- RF-28: WHEN `npm run lint` runs on code that does not await a Promise returned by the Playwright API (`page.*`, `locator.*`, `request.*` or a web-first `expect(...)` assertion), THE SYSTEM SHALL report an error and exit non-zero. Source: interview AC-5
- RF-29: WHEN `npm run lint` runs on a file that imports both `@playwright/test` and `vitest`, THE SYSTEM SHALL report an error and exit non-zero. Source: interview AC-5
- RF-30: WHEN `npm run lint` runs, THE SYSTEM SHALL check `src/`, `tests/`, `scripts/` and root config files, and SHALL ignore `node_modules/`, `playwright-report/`, `test-results/`, `reports/`, `coverage/` and `dist/`. Source: interview AC-5

### Traceability gate
- RF-31: WHEN `npm run spec:check` runs, IF a Playwright or Vitest test title does not start with a TC ID (`TC-NNN-XX`, where `NNN` is three digits and `XX` two or more digits), including when the ID appears only in a `describe` title, THEN THE SYSTEM SHALL fail naming the test. Source: interview AC-6
- RF-32: WHEN `npm run spec:check` runs, IF a test case references an RF that does not exist in its spec, THEN THE SYSTEM SHALL fail naming the TC and the RF. Source: interview AC-6
- RF-33: WHEN `npm run spec:check` runs, IF a spec with status `implemented` or later has a test case with `Automate: Y` and no test whose title starts with its ID, THEN THE SYSTEM SHALL fail naming the TC; a `skip` or `fixme` test counts as an existing test. Source: interview AC-6 (review 2, A-2); change 2026-10-08 (clarification 11)
- RF-34: WHEN `npm run spec:check` runs, IF two different tests start with the same TC ID, THEN THE SYSTEM SHALL fail naming both tests. Source: interview AC-6
- RF-35: WHEN `npm run spec:check` runs, IF a TC ID is defined more than once in a `test-cases.md`, THEN THE SYSTEM SHALL fail naming the TC ID and the file. Source: interview AC-6 (review 2, E-3)
- RF-36: WHEN `npm run spec:check` runs, IF a test title uses a TC ID whose spec folder does not exist, THEN THE SYSTEM SHALL fail naming the test and the TC ID. Source: interview AC-6
- RF-37: WHEN `npm run spec:check` runs, IF a test is marked `skip` or `fixme`, THEN THE SYSTEM SHALL report a warning and set its status to `skipped` without failing. Source: interview AC-6
- RF-38: WHEN `npm run spec:check` runs, IF a spec has no `test-cases.md`, THEN THE SYSTEM SHALL pass when the spec status is `draft` or `approved` and fail naming the spec otherwise. Source: interview AC-6
- RF-39: WHEN `npm run spec:check` runs, IF a spec with status `test-cases-approved` or later has an RF with no TC, THEN THE SYSTEM SHALL fail naming the RF. Source: docs/test-plan.md §7 (review 2, E-4)
- RF-40: WHEN `npm run spec:check` runs and no violation exists, THE SYSTEM SHALL exit with code 0. Source: interview AC-6
- RF-41: WHEN `npm run spec:check` runs and `specs/` contains no spec, THE SYSTEM SHALL print "No specs found" and exit with code 0. Source: interview AC-6
- RF-42: WHEN `npm run spec:check -- --write` runs, THE SYSTEM SHALL regenerate (or create, if missing) `docs/traceability.md` with one row per Spec / RF / TC / test file / status, where status is one of `automated`, `skipped`, `manual` (`Automate: N`) or `missing` (`Automate: Y` without a test). Source: interview AC-6
- RF-43: IF `npm run spec:check -- --write` cannot write `docs/traceability.md`, THEN THE SYSTEM SHALL exit non-zero with the reason. Source: interview AC-6
- RF-68: WHEN `npm run spec:check` runs, IF a spec with a status earlier than `implemented` has a test case with `Automate: Y` and no test whose title starts with its ID, THEN THE SYSTEM SHALL report a warning naming the TC without failing. Source: change 2026-10-08 (clarification 11)

### Test data
- RF-44: WHEN the data factory generates a value, THE SYSTEM SHALL prefix it with `TEST_`. Source: interview AC-7
- RF-45: WHEN the data factory generates a value, THE SYSTEM SHALL include the worker ID (passed as a parameter) and a timestamp, so that generating 2,500 values for each worker ID from 0 to 3 yields 10,000 values with zero duplicates. Source: interview AC-7 (review 2, A-4)

### Reporting and retries
- RF-46: WHEN a Playwright run finishes, THE SYSTEM SHALL produce an HTML report in `playwright-report/` and a JUnit XML report at `reports/junit.xml`. Source: interview AC-8 (review 2, A-5)
- RF-47: WHILE the `CI` environment variable is `true`, THE SYSTEM SHALL retry a failed test up to 2 times. Source: interview AC-8 (clarification 5)
- RF-48: WHILE the `CI` environment variable is not `true`, THE SYSTEM SHALL not retry failed tests. Source: interview AC-8
- RF-49: WHEN a UI test is retried for the first time, THE SYSTEM SHALL record a trace under `test-results/` and keep it whether the retry passes or fails. Source: interview AC-8
- RF-50: WHEN a test passes on retry, THE SYSTEM SHALL mark it as flaky in the HTML and JUnit reports. Source: docs/test-plan.md §7
- RF-51: WHEN a CI Playwright job finishes, THE SYSTEM SHALL print the number of flaky tests. Source: docs/test-plan.md §7

### Sanity smoke tests
- RF-52: WHEN the `@smoke @regression @ui` sanity test opens BASE_URL + `/#/auth/login` (with a single `/` whether or not BASE_URL ends with one), THE SYSTEM SHALL verify that the email input, the password input and the Login button are visible. Source: interview AC-9 (review 2, A-3)
- RF-53: IF the login page does not load within 30 s, or answers with an HTTP status of 400 or higher, THEN THE SYSTEM SHALL fail the UI sanity test with the message "Login page unavailable: <URL> (<status or timeout>)". Source: interview AC-9 (review 2, E-2)
- RF-54: WHEN the `@smoke @regression @api` sanity test sends `POST {API_BASE_URL}/auth/login` with body `{"userEmail", "userPassword"}` of test account A, THE SYSTEM SHALL verify an HTTP 200 response whose JSON body contains a non-empty string `token` field. Source: interview AC-9 (clarifications 1 and 6)
- RF-55: IF the login API answers with a status other than 200, THEN THE SYSTEM SHALL fail the API sanity test showing the status code and naming `TEST_USER_EMAIL`, never its value. Source: interview AC-9
- RF-56: IF the login response is not JSON, or its `token` is missing, empty or `null`, THEN THE SYSTEM SHALL fail with the message "Login response has no valid token (status <code>, content-type <type>)". Source: interview AC-9
- RF-57: IF the login request gets no HTTP response within 30 s (DNS failure, connection refused or timeout), THEN THE SYSTEM SHALL fail with the message "Login API unreachable: <error type> (<API_BASE_URL>)". Source: interview AC-9 (review 2, E-1)

### CI/CD (eyter_dev and promotion)
- RF-58: WHEN a commit is pushed to `eyter_dev`, THE SYSTEM SHALL run spec:check, lint, typecheck, unit tests, the API smoke suite and the UI smoke suite on chromium, followed by `check:secrets` after the Playwright jobs. Source: interview AC-10 (review 2, T-1)
- RF-59: IF any job of a push pipeline on `eyter_dev`, `release`, `main` or `production` fails, THEN THE SYSTEM SHALL mark the pipeline as failed. Source: interview AC-10; change 2026-10-08 (clarification 12)
- RF-60: WHEN the pipeline is started manually with SUITE=smoke or SUITE=regression, THE SYSTEM SHALL run the tests tagged `@smoke` or `@regression` respectively. Source: interview AC-10 (review 1, A-3)
- RF-61: WHEN the pipeline is started manually with BROWSER=chromium, firefox, webkit or all, THE SYSTEM SHALL run the UI tests on that browser (all = the three), and the `@api` tests once regardless of BROWSER. Source: interview AC-10 (clarification 3)
- RF-62: IF SUITE or BROWSER has an unsupported value (msedge included), THEN THE SYSTEM SHALL fail the pipeline with a message naming the variable and its allowed values. Source: interview AC-10
- RF-63: IF the selected suite matches zero tests, THEN THE SYSTEM SHALL fail with the message "No tests found for SUITE=<value>". Source: interview AC-10 (review 1, A-3)
- RF-64: WHILE running in CI, THE SYSTEM SHALL read TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_2_EMAIL and TEST_USER_2_PASSWORD from masked and protected GitLab CI/CD variables; BASE_URL and API_BASE_URL may be visible. Source: interview AC-10 (review 1, A-1), docs/test-plan.md §8
- RF-65: THE SYSTEM's CI scripts SHALL not print the environment (no `env`, `printenv`, `set -x` or equivalent). Source: constitution #5 (review 1, A-1)
- RF-66: WHEN a CI Playwright job finishes, THE SYSTEM SHALL publish `reports/junit.xml` as a GitLab test report. Source: docs/test-plan.md §10
- RF-67: WHEN a CI Playwright job finishes, passed or failed, THE SYSTEM SHALL keep `playwright-report/`, `reports/` and `test-results/` as job artifacts for 7 days. Source: docs/test-plan.md §10
- RF-69: WHEN a commit is pushed to `release`, THE SYSTEM SHALL run spec:check, lint, typecheck, unit tests and the `@regression` suite on the `api`, chromium, firefox and webkit projects, followed by `check:secrets` after the Playwright job. Source: docs/test-plan.md §6; change 2026-10-08 (clarification 12)
- RF-70: WHEN a commit is pushed to `main`, THE SYSTEM SHALL run spec:check, lint, typecheck, unit tests and the `@smoke` suite on the `api`, chromium, firefox and webkit projects, followed by `check:secrets` after the Playwright job. Source: docs/test-plan.md §6; change 2026-10-08 (clarification 12)
- RF-71: WHEN a commit is pushed to `production`, THE SYSTEM SHALL run spec:check, lint, typecheck, unit tests and the `@smoke` suite on the `api` and chromium projects, followed by `check:secrets` after the Playwright job. Source: change 2026-10-08 (clarification 12)
- RF-72: WHEN every job of a push pipeline on `eyter_dev`, `release` or `main` succeeds, THE SYSTEM SHALL merge the pipeline's commit into the next branch (`release`, `main` and `production` respectively) through a merge request. Source: docs/test-plan.md §6; change 2026-10-08 (clarification 12)
- RF-73: IF any job of a push pipeline fails or is canceled, THEN THE SYSTEM SHALL not start the promotion of that pipeline's commit; manual "Run pipeline" runs and `production` pipelines never promote. Source: change 2026-10-08 (clarification 12)
- RF-74: IF the source branch has moved past the pipeline's commit, or the merge request cannot be merged (conflict, missing permission, or not mergeable within 60 s), THEN THE SYSTEM SHALL fail the promotion job with a message naming the source branch, the target branch and the reason, and merge nothing. Source: change 2026-10-08 (clarification 12)
- RF-75: IF the target branch already contains the pipeline's commit, THEN THE SYSTEM SHALL pass the promotion job with the message "<target> is already up to date" and merge nothing. Source: change 2026-10-08 (clarification 12)
- RF-76: WHEN a promotion merges, THE SYSTEM SHALL keep the source branch and SHALL not force-push or delete any branch. Source: AGENTS.md rules; change 2026-10-08 (clarification 12)
- RF-77: WHILE promoting, THE SYSTEM SHALL read the GitLab token from the masked and protected CI/CD variable `PROMOTION_TOKEN` and SHALL not print it; IF it is missing or empty, THEN THE SYSTEM SHALL fail naming `PROMOTION_TOKEN`. Source: constitution #5; change 2026-10-08 (clarification 12)

## Non-functional requirements
- Stack: Node 20 or later locally; CI uses the Node version shipped by the Playwright Docker image of RF-2 (Node 24 for Playwright 1.63) + npm; approved dependencies only: typescript, @playwright/test, vitest, eslint, typescript-eslint, eslint-plugin-playwright, zod, dotenv, @types/node (approved at plan review).
- Security: passwords and tokens only in `.env` (gitignored) and masked, protected GitLab variables; never in code, reports, traces or chat. Test account emails should be dedicated test addresses, not personal ones.
- Time budgets: page navigation and API requests in sanity tests time out at 30 s (named constant).
- Browsers: chromium, firefox, webkit (local + CI); msedge local only, on explicit request.
- Language: everything in English.

## Edge cases
- `.env` missing entirely, or a variable empty or whitespace-only (RF-16, RF-17).
- A variable set both in `.env` and in the process environment (RF-15).
- `.env.example` out of sync with RF-13 (RF-19).
- BASE_URL with or without a trailing slash; malformed URLs (RF-16, RF-52).
- Target site down or slow (RF-53); login API down, slow, unreachable or rate limited (RF-55, RF-57).
- Shared demo account A locked or its password changed by a third party: smoke fails (RF-55); recovery is a manual step documented in the README.
- Login API answers 200 with no valid token, or a non-JSON body (RF-56).
- Sensitive values hidden inside trace archives or URL-encoded (RF-23).
- Parallel workers generating data at the same millisecond (RF-45).
- Malformed, duplicate or orphan TC IDs; IDs only in `describe` titles; skipped tests; RFs without TCs (RF-31 to RF-39).
- A spec whose test cases are approved but not yet implemented: missing tests are warnings, not failures, so the pipeline stays usable during implementation (RF-33, RF-68).
- Specs without `test-cases.md`, empty `specs/`, unwritable `docs/traceability.md` (RF-38, RF-41, RF-43).
- A retried test that passes (flaky) (RF-50, RF-51).
- A local run with `CI=true` set by accident behaves as CI (documented in the README).
- A run without `--project` on a machine without Edge (RF-10); msedge requested in CI (RF-62).
- A manual run on an unprotected branch has no credentials: the API smoke fails with the RF-17 message.
- Concurrent pipelines on `eyter_dev`: sanity tests create no data, so they do not interfere.
- Promotion: two pipelines of the same branch finishing together (promotions run one at a time per branch); a newer commit pushed to the source branch while the pipeline ran (RF-74); a conflict on the target branch (RF-74); a promotion merge request already open (reused, RF-72); nothing new to promote (RF-75).
- A unit test indirectly importing a module that reads environment variables (RF-7).

## Out of scope
- Business tests (catalog, cart, checkout, orders).
- UI/API login scenarios (invalid credentials, logout, session expiry); RF-54 only proves API reachability with account A. How UI login keeps passwords out of traces (RF-22) is decided in the auth spec.
- Publishing the validated framework or its reports from `production` (deploy); `production` only runs a sanity gate (RF-71).
- Merge-request pipelines and back-merges from later branches into earlier ones.
- msedge in CI.
- Performance and security testing.

## Done criteria
Every RF has approved test cases; all automated TCs green on chromium and in the `api` project;
test-reviewer PASS; `npm run lint`, `npm run typecheck`, `npm run spec:check` and
`npm run check:secrets` PASS; pipeline on `eyter_dev` green; user validation.

## Open questions
None.

## Resolved clarifications
1. API smoke = login with account A (RF-54).
2. Environment variables are required only when a test reads them; unit tests need none (RF-7, RF-17).
3. msedge runs locally only, on explicit request; CI supports chromium, firefox, webkit (RF-9, RF-61, RF-62).
4. CI reads configuration and credentials from GitLab CI/CD variables; `eyter_dev` is a protected branch (RF-64).
5. CI retries: 2 (RF-47).
6. API login: `POST https://rahulshettyacademy.com/api/ecom/auth/login`, body `{"userEmail", "userPassword"}`, HTTP 200 with a `token` field (RF-54).
7. Spec review 1 (senior QA): 41 findings resolved through proposals A-1 to A-3 and B, approved by the user.
8. Spec review 2 (senior QA): 18 findings resolved (emails are test identifiers, not sensitive values; msedge only on explicit request; `check:secrets` scans trace archives; network-error and page-unavailable failures defined; JUnit at `reports/junit.xml`), approved by the user.
9. Change during implementation (T32, 2026-10-07, approved by the user): the Playwright 1.63.0 Docker image required by RF-2 ships Node 24, so the NFR no longer says "CI uses Node 20 LTS". CI uses the image's Node, and the local minimum stays Node 20. `@types/node`, approved at plan review, is added to the dependency list.
10. Cross-reference (2026-10-08): Spec 001 RF-27 makes an explicit exception to RF-49. Tests that type a real TEST_USER_* password into the browser record no trace, retries included. This settles the "How UI login keeps passwords out of traces" item under Out of scope.
11. Change after validation (2026-10-08, Mode C, approved by the user): once Spec 001 test cases were approved, RF-33 failed `spec:check` for all 40 not-yet-written tests, which would turn the `eyter_dev` pipeline red for the whole implementation of a spec. RF-33 now fails only for specs with status `implemented` or later, and the new RF-68 reports the same gap as a warning before that. The traceability status stays `missing` in both cases (RF-42). Spec 000 keeps `Status: validated`; the change is verified by TC-000-53 and TC-000-96 and recorded in validation.md.
12. Change after validation (2026-10-08, Mode C, approved by the user): automatic promotion `eyter_dev → release → main → production` (RF-69 to RF-77). Each branch runs the gate of docs/test-plan.md §6 (`production`: a sanity smoke). When every job passes, a promotion job merges the tested commit into the next branch through a merge request pinned to that commit, so any failed or canceled job stops the chain. RF-59 now covers every promotion branch. RF-31 now accepts TC IDs with two or more digits after the spec number (`TC-000-100`), because Spec 000 reached TC-000-99. Spec 000 keeps `Status: validated`; the change is recorded in validation.md.
