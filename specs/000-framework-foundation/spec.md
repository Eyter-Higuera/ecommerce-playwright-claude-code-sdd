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
- RF-31: WHEN `npm run spec:check` runs, IF a Playwright or Vitest test title does not start with a TC ID (`TC-NNN-XX`), including when the ID appears only in a `describe` title, THEN THE SYSTEM SHALL fail naming the test. Source: interview AC-6
- RF-32: WHEN `npm run spec:check` runs, IF a test case references an RF that does not exist in its spec, THEN THE SYSTEM SHALL fail naming the TC and the RF. Source: interview AC-6
- RF-33: WHEN `npm run spec:check` runs, IF a test case with `Automate: Y` in `test-cases.md` has no test whose title starts with its ID, THEN THE SYSTEM SHALL fail naming the TC; a `skip` or `fixme` test counts as an existing test. Source: interview AC-6 (review 2, A-2)
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

### CI/CD (eyter_dev)
- RF-58: WHEN a commit is pushed to `eyter_dev`, THE SYSTEM SHALL run spec:check, lint, typecheck, unit tests, the API smoke suite and the UI smoke suite on chromium, followed by `check:secrets` after the Playwright jobs. Source: interview AC-10 (review 2, T-1)
- RF-59: IF any job of the `eyter_dev` pipeline fails, THEN THE SYSTEM SHALL mark the pipeline as failed. Source: interview AC-10
- RF-60: WHEN the pipeline is started manually with SUITE=smoke or SUITE=regression, THE SYSTEM SHALL run the tests tagged `@smoke` or `@regression` respectively. Source: interview AC-10 (review 1, A-3)
- RF-61: WHEN the pipeline is started manually with BROWSER=chromium, firefox, webkit or all, THE SYSTEM SHALL run the UI tests on that browser (all = the three), and the `@api` tests once regardless of BROWSER. Source: interview AC-10 (clarification 3)
- RF-62: IF SUITE or BROWSER has an unsupported value (msedge included), THEN THE SYSTEM SHALL fail the pipeline with a message naming the variable and its allowed values. Source: interview AC-10
- RF-63: IF the selected suite matches zero tests, THEN THE SYSTEM SHALL fail with the message "No tests found for SUITE=<value>". Source: interview AC-10 (review 1, A-3)
- RF-64: WHILE running in CI, THE SYSTEM SHALL read TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_USER_2_EMAIL and TEST_USER_2_PASSWORD from masked and protected GitLab CI/CD variables; BASE_URL and API_BASE_URL may be visible. Source: interview AC-10 (review 1, A-1), docs/test-plan.md §8
- RF-65: THE SYSTEM's CI scripts SHALL not print the environment (no `env`, `printenv`, `set -x` or equivalent). Source: constitution #5 (review 1, A-1)
- RF-66: WHEN a CI Playwright job finishes, THE SYSTEM SHALL publish `reports/junit.xml` as a GitLab test report. Source: docs/test-plan.md §10
- RF-67: WHEN a CI Playwright job finishes, passed or failed, THE SYSTEM SHALL keep `playwright-report/`, `reports/` and `test-results/` as job artifacts for 7 days. Source: docs/test-plan.md §10

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
- Specs without `test-cases.md`, empty `specs/`, unwritable `docs/traceability.md` (RF-38, RF-41, RF-43).
- A retried test that passes (flaky) (RF-50, RF-51).
- A local run with `CI=true` set by accident behaves as CI (documented in the README).
- A run without `--project` on a machine without Edge (RF-10); msedge requested in CI (RF-62).
- A manual run on an unprotected branch has no credentials: the API smoke fails with the RF-17 message.
- Concurrent pipelines on `eyter_dev`: sanity tests create no data, so they do not interfere.
- A unit test indirectly importing a module that reads environment variables (RF-7).

## Out of scope
- Business tests (catalog, cart, checkout, orders).
- UI/API login scenarios (invalid credentials, logout, session expiry); RF-54 only proves API reachability with account A. How UI login keeps passwords out of traces (RF-22) is decided in the auth spec.
- `release` and `main` pipeline stages and production deploy (later specs).
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
