# Plan — Spec 000 Framework foundation

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/000-framework-foundation/spec.md · Test cases: specs/000-framework-foundation/test-cases.md

## Context
This plan builds the framework base described by Spec 000: npm, TypeScript, ESLint, Vitest and
Playwright configuration; environment and secrets handling; the `spec:check` traceability gate;
the `check:secrets` artifact scan; the test data factory; reporting and retries; the two sanity
smoke tests; and the `eyter_dev` GitLab CI stage. The repository has no `src/`, `tests/` or
`scripts/` yet, so every component below is NEW. Main approach: thin configuration files delegate
to pure, unit-testable builders in `src/`; command-line tools live in `scripts/` and are compiled
with `tsc`; unit tests either call those pure functions in-process or spawn the real CLIs (tsc,
ESLint, `playwright --list`, fixture Vitest/Playwright projects) against inputs under
`tests/fixtures/`. Only two tests touch the real site: the UI and API sanity tests.

## Constitution check
| # | Principle | Complies | Notes |
|---|-----------|----------|-------|
| 1 | Simple stack | ✔ | Approved deps only, plus `@types/node` (approved by the user at plan review) (type definitions only; TypeScript strict needs them for `process`, `node:fs`, `node:zlib`, `node:child_process`). No `@eslint/js`, no tsx/ts-node, no zip library. |
| 2 | Spec first | ✔ | Every test title starts with its TC ID; `spec:check` enforces it (RF-31 to RF-43). |
| 3 | Separation of concerns | ✔ | Locators in `LoginPage`, HTTP in `AuthClient`, failure messages in `src/errors/messages.ts`; tests only Arrange / Act / Assert. |
| 4 | Test quality | ✔ | Role/label locators; no hard waits (RF-27 lint rule); unawaited Playwright calls rejected (RF-28). The password input uses `getByLabel` because password inputs have no implicit ARIA role. |
| 5 | Data and secrets | ✔ | No data is created on the site; credentials only via `requireEnv`; outbound network blocked in unit tests (RF-6); redaction helper and `check:secrets`. |
| 6 | Language | ✔ | All code, comments, messages and docs in English. |

## Coverage map
| RF | Test cases | Layer | Test file |
|----|------------|-------|-----------|
| RF-1, RF-3 | TC-000-01, TC-000-02 (manual) | integration | validation.md |
| RF-3 | TC-000-03 | unit | tests/unit/setup/manifest.test.ts |
| RF-2 | TC-000-04, TC-000-05 | unit | tests/unit/ci/playwright-image-version.test.ts |
| RF-4 | TC-000-06, TC-000-07 | unit | tests/unit/setup/typecheck.test.ts |
| RF-5, RF-7 | TC-000-08, TC-000-09, TC-000-12 | unit | tests/unit/setup/vitest-runner.test.ts |
| RF-6 | TC-000-10, TC-000-11 | unit | tests/unit/setup/network-guard.test.ts |
| RF-8, RF-9, RF-10, RF-11, RF-12 | TC-000-14, TC-000-15, TC-000-16, TC-000-17, TC-000-18, TC-000-19, TC-000-20, TC-000-21 | unit | tests/unit/playwright/projects.test.ts |
| RF-7, RF-13, RF-14, RF-15, RF-17 | TC-000-13, TC-000-22, TC-000-23, TC-000-24, TC-000-25 | unit | tests/unit/config/env.test.ts |
| RF-16 | TC-000-26, TC-000-27 | unit | tests/unit/config/base-url-validation.test.ts |
| RF-13, RF-17 | TC-000-28 | unit | tests/unit/config/credential-isolation.test.ts |
| RF-18, RF-19 | TC-000-29, TC-000-30, TC-000-31, TC-000-32 | unit | tests/unit/config/env-example.test.ts |
| RF-20, RF-21 | TC-000-33, TC-000-34, TC-000-35 | unit | tests/unit/security/redaction.test.ts |
| RF-21, RF-22, RF-26 | TC-000-36, TC-000-37 (manual) | integration | validation.md |
| RF-23, RF-24 | TC-000-38, TC-000-39 | unit | tests/unit/security/check-secrets.test.ts |
| RF-25, RF-49 | TC-000-40, TC-000-41 | unit | tests/unit/reporting/tracing.test.ts |
| RF-27, RF-28, RF-29, RF-30 | TC-000-42, TC-000-43, TC-000-44, TC-000-45, TC-000-46, TC-000-47, TC-000-48, TC-000-49 | unit | tests/unit/lint/eslint-rules.test.ts |
| RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40, RF-41 | TC-000-50, TC-000-51, TC-000-52, TC-000-53, TC-000-54, TC-000-55, TC-000-56, TC-000-57, TC-000-61, TC-000-62, TC-000-63, TC-000-64, TC-000-65 | unit | tests/unit/spec-check/spec-check.test.ts |
| RF-37, RF-42, RF-43 | TC-000-58, TC-000-59, TC-000-60 | unit | tests/unit/spec-check/spec-check-write.test.ts |
| RF-44, RF-45 | TC-000-66, TC-000-67, TC-000-68 | unit | tests/unit/data/test-data-factory.test.ts |
| RF-46, RF-47, RF-48 | TC-000-69, TC-000-70, TC-000-71, TC-000-72 | unit | tests/unit/reporting/reporters.test.ts |
| RF-50, RF-51 | TC-000-73, TC-000-74, TC-000-75 | unit | tests/unit/reporting/flaky.test.ts |
| RF-52, RF-53 | TC-000-76 | ui | tests/ui/login-page.spec.ts |
| RF-52 | TC-000-77 | unit | tests/unit/smoke/login-url.test.ts |
| RF-52, RF-53 | TC-000-78, TC-000-79 | mocked | tests/mocked/login-page-unavailable.spec.ts |
| RF-54, RF-55, RF-56, RF-57 | TC-000-80 | api | tests/api/auth-login.spec.ts |
| RF-54, RF-55, RF-56, RF-57 | TC-000-81, TC-000-82, TC-000-83, TC-000-84, TC-000-85 | unit | tests/unit/smoke/login-response.test.ts |
| RF-58, RF-65, RF-66, RF-67 | TC-000-86, TC-000-87, TC-000-95 | unit | tests/unit/ci/gitlab-ci.test.ts |
| RF-59, RF-66, RF-67 | TC-000-88, TC-000-89 (manual) | integration | validation.md |
| RF-60, RF-61, RF-62, RF-63 | TC-000-90, TC-000-91, TC-000-92 | unit | tests/unit/ci/ci-run-suite.test.ts |
| RF-64 | TC-000-93, TC-000-94 (manual) | integration | validation.md |

Manual TCs (`Automate: N`) are executed and recorded in `validation.md`; `spec:check` reports
them as `manual`.

## Page Objects and components
| Class | File | Responsibility | Key locators (by priority) |
|-------|------|----------------|----------------------------|
| LoginPage (NEW) | src/pages/login-page.ts | Opens `buildLoginUrl(BASE_URL)` with `NAVIGATION_TIMEOUT_MS`; a status ≥ 400 or a navigation timeout throws `LoginPageUnavailableError` with "Login page unavailable: <URL> (<status or timeout>)"; exposes the three form controls (covers RF-52, RF-53, TC-000-76, TC-000-78, TC-000-79) | `getByRole('textbox', { name: EMAIL_LABEL })`, `getByLabel(PASSWORD_LABEL)`, `getByRole('button', { name: LOGIN_BUTTON })` — `// TODO: VERIFY` accessible names on the live page |

Label and button texts live in `src/pages/login-page.constants.ts`, not inline in tests.

## API clients and schemas
| Client / schema | File | Endpoints / contract |
|-----------------|------|----------------------|
| AuthClient (NEW) | src/api/auth-client.ts | `login(credentials)` → `POST {API_BASE_URL}/auth/login`, body `{ userEmail, userPassword }`, timeout `API_TIMEOUT_MS`. Typed with `import type { APIRequestContext }` so unit tests can pass stubs (covers RF-54, TC-000-80, TC-000-10) |
| loginResponseSchema (NEW) | src/api/schemas/login-response.schema.ts | zod `{ token: z.string().min(1) }` (covers RF-54, RF-56) |
| login response checks (NEW) | src/api/login-response.ts | `assertLoginResponse(response)`: non-200 → message with the status and `TEST_USER_EMAIL` (never its value); non-JSON or invalid token → "Login response has no valid token (status <code>, content-type <type>)". `classifyNetworkError(error, apiBaseUrl)`: ECONNREFUSED / ENOTFOUND / timeout → "Login API unreachable: <error type> (<API_BASE_URL>)" (covers RF-55, RF-56, RF-57, TC-000-81 to TC-000-85) |

The returned token is registered with the redaction helper and never logged or attached (RF-20,
RF-26).

## Fixtures and test data
- `src/config/env.ts` (NEW): `loadEnv({ processEnv, dotenvPath })` parses `.env` from
  `process.cwd()` with dotenv `parse` and merges it under the process environment (process values
  win, empty strings included); `requireEnv(name)` is a lazy accessor that throws
  "Missing required environment variable: <NAME>" for missing, empty or whitespace-only values;
  `validateBaseUrls(env)` checks BASE_URL and API_BASE_URL are absolute http/https URLs (zod).
  Nothing is read at import time (covers RF-7, RF-13 to RF-17).
- `src/config/urls.ts` (NEW): `buildLoginUrl(baseUrl)` always joins with a single `/`
  (covers RF-52, TC-000-77).
- `src/config/timeouts.ts` (NEW): `NAVIGATION_TIMEOUT_MS = 30_000`, `API_TIMEOUT_MS = 30_000`.
- `src/security/redact.ts` (NEW): `getSensitiveValues(env, tokens)` returns the two passwords and
  any registered token (emails excluded); `redact(text, values)` replaces them with `[REDACTED]`
  (covers RF-20, RF-21, TC-000-33, TC-000-34).
- `src/errors/messages.ts` (NEW): builders for the RF-17, RF-53, RF-55, RF-56 and RF-57 messages;
  they name variables, never email or password values (covers RF-21, TC-000-35).
- `src/fixtures/test.ts` (NEW): Playwright `test.extend` with `loginPage`, `authClient` and
  `accountA`; `accountA` calls `requireEnv` inside the fixture so a missing credential fails only
  the test that uses it (RF-17, TC-000-28). An auto fixture annotates retried tests (flaky
  fallback, see Risks).
- `src/data/test-data-factory.ts` (NEW): `uniqueValue(base, workerId, clock = Date.now)` →
  `TEST_<base>_w<workerId>_<timestamp>_<counter><random4>`; the module counter keeps values
  distinct within the same millisecond (covers RF-44, RF-45, TC-000-66 to TC-000-68).
- Accounts: only account A (TEST_USER_EMAIL / TEST_USER_PASSWORD) is used; account B is reserved
  for the auth spec. Spec 000 creates no data on the site, so no cleanup is needed.

## Mocking strategy
- **Unit tests (Vitest):** `tests/unit/setup/block-network.ts` (setupFiles) replaces
  `http.request`, `http.get`, `https.request`, `https.get` and `globalThis.fetch` with a function
  that throws "Network access is disabled in unit tests: <url>" (RF-6). Collaborators are stubbed
  with plain objects or `vi.fn`; the clock is injected into the data factory.
- **CLI-level unit tests:** `tests/unit/helpers/run-cli.ts` spawns `tsc`, Vitest or Playwright with
  a minimal environment and an empty temporary working directory, so the repository `.env` is
  never loaded. Fixture projects live in `tests/fixtures/` (`vitest/*`, `playwright/*` using only
  `page.setContent`, `lint/*`, `typecheck/*`, `spec-check/*`, `secrets/*`, `ci/*`). Trace archives
  for TC-000-38/39 are built at test time by `tests/unit/helpers/make-zip.ts` (no binary fixtures).
- **Mocked UI:** `page.route('**/*')` answers 503 (TC-000-78) or never answers, with a short named
  timeout passed to `LoginPage.open` (TC-000-79); that test also asserts the default budget is
  30,000 ms.
- **Real environment:** only TC-000-76 (UI) and TC-000-80 (API).

## Locator strategy
The target is the third-party page https://rahulshettyacademy.com/client/#/auth/login.
- Email: `getByRole('textbox', { name: EMAIL_LABEL })` — `// TODO: VERIFY` the accessible name ("Email").
- Password: `getByLabel(PASSWORD_LABEL)` — password inputs have no implicit role, so label is the
  highest available priority — `// TODO: VERIFY` the label ("Password").
- Login button: `getByRole('button', { name: LOGIN_BUTTON })` — `// TODO: VERIFY` the name ("Login").
- No CSS fallback is planned. If a control has no accessible name, the fallback is
  `getByPlaceholder`, with a justifying comment.

## Test file layout, tags and browsers
- **Playwright projects** are built by `buildPlaywrightConfig(env, argv)` in
  `src/config/playwright-options.ts` and wrapped by `playwright.config.ts`:
  - `api`: `tests/api/**`, no browser, trace `off` (RF-11, RF-25).
  - `chromium`, `firefox`, `webkit`: `tests/ui/**` and `tests/mocked/**`, trace `on-first-retry` (RF-8, RF-49).
  - `msedge` (channel `msedge`): added only when argv contains `--project=msedge` or `--project msedge` (RF-9, RF-10).
  - `validateBaseUrls` runs when the config loads, so an invalid BASE_URL or API_BASE_URL stops the run before listing (RF-16).
- **Reporters:** `list`; `html` → `playwright-report/` (open never); `junit` → `reports/junit.xml`;
  `json` → `reports/results.json`, which feeds the flaky summary (RF-46, RF-50, RF-51).
  Retries: `CI === 'true' ? 2 : 0` (RF-47, RF-48).
- **Tags** use the Playwright `tag` option:

  | Test | Tags |
  |---|---|
  | TC-000-76 | `@smoke @regression @ui @critical` |
  | TC-000-80 | `@smoke @regression @api @critical` |
  | TC-000-78, TC-000-79 | `@regression @mocked` |

  Vitest tests carry no tags.
- **`describe` blocks** are grouped by scenario type: positive, negative, boundary and security.
- **Vitest config:** include `tests/unit/**/*.test.ts` and exclude `tests/fixtures/**`. The
  `CLI_TEST_TIMEOUT_MS` constant (60 s) applies to the tests that spawn processes.
- **`tests/fixtures/**`** holds intentionally invalid inputs. It is excluded from lint,
  typecheck, the Vitest include, the Playwright testDir and the `spec:check` scan; the lint and
  typecheck tests point at it explicitly.

### Tooling files (NEW)
- **`package.json`**
  - `engines.node` is `>=20`, and `@playwright/test` is pinned to an exact version.
  - Scripts: `typecheck`, `lint`, `test:unit`, `build:scripts`, `spec:check`, `check:secrets`, `report:flaky`, `ci:run-suite`, and `postinstall: playwright install chromium firefox webkit` (RF-1).
- **`.npmrc`** has `engine-strict=true` (RF-3).
- **`tsconfig.json`** is strict, NodeNext, no emit. **`tsconfig.scripts.json`** emits `scripts/` and `src/` to `dist/`.
- **Config files:** `eslint.config.mjs`, `vitest.config.mts`, `playwright.config.ts`.
- **`.env.example`** lists the six RF-13 variables with placeholders (RF-18).
- **`.gitignore`** adds `reports/`.
- **`.gitlab-ci.yml`** defines the CI pipeline (see below).
- **README** gets a setup section: how to recover account A, and that `CI=true` set locally behaves like CI.

### Scripts (NEW)
Each script exports a pure function that the unit tests call in-process.
- **`scripts/spec-check/`**
  - Markdown parser for `spec.md` (status, RFs) and `test-cases.md` (TC IDs, Requirement, Automate).
  - Test-title scanner built on the TypeScript compiler API; it detects `skip`/`fixme` and ignores `describe` titles.
  - The rules of RF-31 to RF-41.
  - The traceability matrix writer (RF-42, RF-43).
  - Options: `--root` (to point at fixtures) and `--write`.
- **`scripts/check-secrets.ts`** with **`scripts/lib/zip-reader.ts`**: scans `reports/`, `playwright-report/` and `test-results/`, including the contents of zip archives (RF-23, RF-24).
- **`scripts/flaky-summary.ts`**: prints "Flaky tests: <n>" from `reports/results.json` (RF-51).
- **`scripts/ci-run-suite.ts`**: validates SUITE and BROWSER, builds the `--grep` and `--project` arguments, counts the selected tests with `--list --reporter=json`, then runs Playwright (RF-60 to RF-63).
- **`scripts/lib/playwright-version.ts`**: compares the CI image tag with the locked `@playwright/test` version (RF-2).
- **`scripts/check-ci-scripts.ts`**: flags `env`, `printenv` and `set -x` in CI scripts (RF-65).

### ESLint (`eslint.config.mjs`)
- typescript-eslint `recommendedTypeChecked` with `@typescript-eslint/no-floating-promises` as an error (RF-28).
- eslint-plugin-playwright `flat/recommended`, with `playwright/no-wait-for-timeout` and `playwright/missing-playwright-await` as errors (RF-27, RF-28).
- `no-restricted-imports` (RF-29):
  - `vitest` is forbidden in `**/*.spec.ts` and `src/**`;
  - `@playwright/test` is forbidden in `**/*.test.ts`.
- Lints `src/`, `tests/`, `scripts/` and the root config files.
- Ignores `node_modules/`, `playwright-report/`, `test-results/`, `reports/`, `coverage/`, `dist/` (RF-30) and `tests/fixtures/**`.
- TC-000-45 asserts one error-bearing line per unawaited call, because two rules may both report the `expect` line.

### CI (`.gitlab-ci.yml`)
- **Image:** every job uses `mcr.microsoft.com/playwright:v<locked version>-noble` (RF-2).
- **Push pipeline**, rule `$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "eyter_dev"` (RF-58):
  - Stage `check`: spec:check, lint, typecheck, unit.
  - Stage `smoke`: API smoke (`--project=api --grep @smoke`) and UI smoke (`--project=chromium --grep @smoke`).
  - Stage `scan`: `check:secrets`, with `needs` on both smoke jobs' artifacts.
- **Manual pipeline**, rule `$CI_PIPELINE_SOURCE == "web"`: a `run-suite` job (`npm run ci:run-suite`) followed by `check:secrets` (RF-60 to RF-63).
- **Every Playwright job:**
  - `after_script: npm run report:flaky` (RF-51);
  - artifacts `playwright-report/`, `reports/` and `test-results/` with `when: always` and `expire_in: 7 days` (RF-67);
  - `reports: junit: reports/junit.xml` (RF-66).
- **Secrets:** no job prints the environment (RF-65). The credentials come from masked, protected variables (RF-64, configured in GitLab).

## Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| Pure config builder `buildPlaywrightConfig(env, argv)` plus a thin `playwright.config.ts` | Unit-testable without importing Playwright into Vitest (keeps RF-29 clean) | Importing the real config file in Vitest |
| `msedge` project added only when argv requests it | RF-9 and RF-10 require it to be absent from default runs | An `EDGE=1` environment flag (not in the spec) |
| Base URL validation when the config loads | RF-16 must stop the run before any test, `--list` included | `globalSetup` (runs after test collection) |
| `.env` read from `process.cwd()` | CLI-level unit tests can run from an empty temp directory without the real `.env` | A custom variable to disable `.env` loading (not in RF-13) |
| Scripts compiled with `tsc` to `dist/` | Node 20 cannot run TypeScript directly; no new runner needed | tsx / ts-node (new dependency); plain JavaScript (breaks the TS strict rule) |
| CommonJS output with NodeNext resolution | Extensionless relative imports work in Vitest, Playwright and compiled scripts | ESM with `.js` import suffixes |
| `spec:check` scans test titles with the TypeScript compiler API | Covers Vitest and Playwright, sees `skip`/`fixme`, needs no environment | Regex (fragile); `playwright --list` (needs env, misses Vitest) |
| `--write` writes the matrix even when violations exist, then exits non-zero | `missing` rows stay visible (assumption recorded in test-cases.md) | Refusing to write on violations |
| `check:secrets` searches for the password values (plain and URL-encoded) and for tokens by JWT shape (`eyJ….eyJ….…`) | The token issued during a run is not known after the run | Persisting tokens to disk so they can be searched |
| Own minimal zip reader on `node:zlib` (stored and deflate entries) | No zip dependency is approved | adm-zip / jszip |
| Flaky count taken from the JSON reporter (`stats.flaky`) | Stable, machine-readable source | Parsing the HTML report |
| One Playwright image for every CI job | Satisfies RF-2 and provides browsers for the fixture runs in unit tests | Node image plus a browser download per job |
| `@playwright/test` pinned to an exact version | The image tag must equal the installed version (RF-2) | Caret range |

## Risks
- **JUnit flaky marking (TC-000-73):** `// TODO: VERIFY` how the Playwright JUnit reporter marks a
  flaky test. Fallback: the auto fixture adds a `flaky-retry` annotation on retries and the
  `junit` reporter runs with `embedAnnotationsAsProperties: true`.
- **CI Node version:** the Playwright image may ship a Node major other than 20, while the NFR
  says "CI uses Node 20 LTS". `// TODO: VERIFY` in the first task. If it differs, a Mode C spec
  change is proposed before continuing.
- **Shared demo site:** if the site or API is down or rate limited, or account A is locked or
  changed by a third party, the smoke tests go red. Mitigation: the clear RF-53, RF-55 and RF-57
  messages, and the recovery steps in the README.
- **Slow unit suite:** the tests that spawn processes are slow. Mitigation: a named timeout and
  tiny fixtures.
- **Type-aware lint on fixtures:** linting files outside `tsconfig.json` may need
  `projectService.allowDefaultProject`. `// TODO: VERIFY`.
- **msedge detection:** detecting a `msedge` request depends on the format of the Playwright CLI
  argv. `// TODO: VERIFY`.

## Out of scope
- Business tests, login scenarios beyond RF-54, the `release`/`main` pipeline stages, msedge in
  CI, and performance or security testing.
- Data cleanup, since Spec 000 creates no data.
- Manual TCs TC-000-01, TC-000-02, TC-000-36, TC-000-37, TC-000-88, TC-000-89, TC-000-93 and
  TC-000-94 are executed and recorded during validation, not automated.

## Change after validation: staged jobs, test summaries and results page (clarifications 15 to 17)

### Workflow (`.github/workflows/ci.yml`)
| Stage | Job | needs | Runs |
|---|---|---|---|
| 1 | `checks` (matrix spec:check, lint, typecheck; `fail-fast: true`) | — | spec:check with `--summary` on its leg (RF-86) |
| 2 | `unit-tests` | checks | `npm run test:unit:ci` (results + coverage), `report:summary` (RF-84, RF-85) |
| 3 | `eyter-dev-api`, `release-api`, `main-api`, `production-api` | unit-tests | `npx playwright test --grep <tag> --project=api` |
| 4 | `<branch>-ui-chromium` → `<branch>-ui-firefox` → `<branch>-ui-webkit` (firefox and webkit on release and main only) | the previous job | `npx playwright test --grep <tag> --project=<browser>` |
| manual | `run-suite` | unit-tests | `npm run ci:run-suite` (unchanged) |
| publish | `publish-results` (`always()`, push only, `pages: write`, `id-token: write`, environment `github-pages`, concurrency `pages`) | every test job | download `summary-*`, `report:pages`, `check:secrets`, upload-pages-artifact, deploy-pages (RF-88) |
| last | `promote` (unchanged rules) | every other job | `npm run ci:promote` |

Each test job: checkout → safe.directory → `npm ci` → tests → `report:flaky` (Playwright) →
`report:summary` (`if: always()`) → `check:secrets` (`if: always()`, `id: secrets`) → upload of
`playwright-report/`, `reports/`, `test-results/` and of `summary-<job>` (`reports/summary.json`)
only when the scan passed (RF-79).

### Scripts (NEW)
- **`scripts/test-summary.ts`** (`npm run report:summary -- --title <stage> [--report <file>]`):
  pure `summarize(resultsText)` detects Playwright JSON (`stats`, `suites`) or Vitest JSON
  (`numTotalTests`), `renderSummary()` builds the Markdown table (failed titles capped at 50),
  `renderCoverage()` reads `reports/coverage/coverage-summary.json`; `main()` prints, appends to
  `GITHUB_STEP_SUMMARY` when set and writes `reports/summary.json` (stage, counts, duration,
  coverage, failed titles). Missing file → "Results unknown (no report at <path>)", exit 0 (RF-87).
  Same structure as `scripts/flaky-summary.ts`.
- **`scripts/spec-check/summary.ts`**: `requirementsSummary(specs, rows)` from the `TraceRow[]` of
  `checkTraceability`; `run.ts` gets a `--summary` option that prints it, appends it to
  `GITHUB_STEP_SUMMARY` and writes `reports/summary.json` (stage "Requirements coverage").
- **`scripts/results-page.ts`** (`npm run report:pages`): pure `mergeResults(previous, branch,
  run, summaries)` and `renderPage(results)` (HTML-escaped, no scripts, no dependency); `main()`
  reads the published `results.json` through an injected fetcher (404 → empty, other failure →
  exit 1 naming URL and reason, RF-88), reads the downloaded `summary-*/summary.json` files and
  writes `reports/pages/index.html` and `reports/pages/results.json`. Branch, commit, run URL and
  date come from `GITHUB_REF_NAME`, `GITHUB_SHA`, `GITHUB_SERVER_URL`/`GITHUB_REPOSITORY`/`GITHUB_RUN_ID`.

### Tooling
- `@vitest/coverage-v8` pinned to the installed vitest version (approved, clarification 16).
- `vitest.config.mts`: `coverage: { provider: 'v8', include: ['src/**', 'scripts/**'], reporter:
  ['text', 'json-summary', 'html'], reportsDirectory: 'reports/coverage', reportOnFailure: true }`, no thresholds.
- `package.json`: `test:unit:ci`, `report:summary`, `report:pages`.
- Unit tests never make real HTTP calls: `results-page` tests inject a stub fetcher (constitution #5).

### Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| One job per stage and per browser, chained with `needs` | A failure skips every later job (RF-83) | Matrix per browser (siblings keep running) |
| Results page on GitHub Pages, previous state read from the published `results.json` | The workflow cannot commit (RF-81); Pages keeps one site, so other branches must be carried over | Committing a results table to README (breaks RF-81, loops runs) |
| Summary data passed between jobs as small `summary-<job>` artifacts | Jobs run on separate machines | Re-running tests in the publish job |
| Plain HTML page, escaped text | No dependency; titles are data (TC-000-131) | A static-site generator |

### Risks
- Pages and the `github-pages` environment must be configured by the user (repository public,
  Source: GitHub Actions, four branches allowed); until then `publish-results` fails and blocks
  promotion (spec edge case).
- Coverage with `reportOnFailure` adds a few seconds to the unit job.

## Change after validation: manual runs by layer, regression chain, VS Code tasks, bug log (clarifications 18 and 19)

### Manual run (`.github/workflows/ci.yml`)
| Job | needs | Runs when | Does |
|---|---|---|---|
| `checks` (first step: RF-92 guard) | — | always | guard step before checkout fails a direct regression on release, main or production unless `inputs.chained` |
| `unit-tests` | checks | always | unchanged |
| `manual-api` | unit-tests | dispatch and layer ∈ {all, api} | `npm run ci:run-suite` with LAYER=api |
| `manual-ui` | unit-tests, manual-api | dispatch and layer ∈ {all, ui}, `!cancelled() && !failure()` (runs when manual-api was skipped) | `npm run ci:run-suite` with LAYER=ui |
| `chain-next` | checks, unit-tests, manual-api, manual-ui | dispatch, suite=regression, branch ≠ production, `!cancelled() && !failure()`; `permissions: actions: write` | `npm run ci:chain` |
Inputs: `suite`, `browser`, `layer` (all, unit, api, ui; default all), `chained` (boolean, default false).
`run-suite` is removed; `promote` and `publish-results` keep ignoring manual runs.

### Scripts
- **`scripts/ci-run-suite.ts`**: `selectRun(env)` validates LAYER too and returns a plan:
  `{ unit: boolean, playwrightArgs?: string[] }`; `runSuite()` runs the unit tests first (stub
  runner `runUnit()` → `vitest run`), stops on failure, then lists and runs Playwright as before.
- **`scripts/ci-chain.ts`** (`npm run ci:chain`): same structure as `scripts/ci-promote.ts`
  (reuses `nextBranch()`; injected `GitHubHttp`; required variables `GITHUB_TOKEN`,
  `GITHUB_API_URL`, `GITHUB_REPOSITORY`, `GITHUB_REF_NAME`, `SUITE`, `BROWSER`, `LAYER`);
  `POST /repos/{repo}/actions/workflows/ci.yml/dispatches` with `{ ref, inputs }`, 204 = success.

### VS Code and docs
- `.vscode/tasks.json`: inputs `layer`, `suite`, `browser`, `branch` (pickString); tasks
  "Tests: run locally (layer, suite, browser)", "Tests: unit with coverage", "Tests: open Playwright
  report", "GitHub: start manual run (branch, suite, browser, layer)", "GitHub: watch run".
  `.vscode/extensions.json`: `ms-playwright.playwright`, `vitest.explorer`.
- `docs/bug-log.md`: header, column legend, rows; AGENTS.md rule under "When finishing any task".
- README: VS Code section, manual GitHub run table with `-f layer=`, regression chain section.

### Technical decisions
| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| Chain through `workflow_dispatch` with the job's `GITHUB_TOKEN` and `actions: write` | Dispatch events sent with GITHUB_TOKEN start runs; no extra secret | `PROMOTION_TOKEN` (Contents write is not needed to dispatch) |
| RF-92 guard as the first step of `checks` | Every later job needs checks, push runs are untouched, no extra job in TC-000-119's chain | A separate guard job (would have to be needed by checks, also in push runs) |
| LAYER inside `ci:run-suite` | One selector for CI and the VS Code tasks | Separate scripts per layer |

## Change after validation: failure report and /fix-failure (clarifications 20 and 21)
- **`scripts/failure-report.ts`** (`npm run report:failures [-- --run <id>]`): pure
  `playwrightFailures(text)` (walks suites → specs → tests whose status is `unexpected`; first
  result with an error: title, project, `file:line`, first error line, `trace` / `screenshot`
  attachment paths), `vitestFailures(text)` (assertion results with status `failed`; title, file,
  first failure-message line), `githubRunFailures(jobsJson, logText)` (failed jobs and steps, last
  40 log lines), `renderFailures()`. Redaction: `redact()` + `getSensitiveValues(loadEnv())` from
  `src/security/redact.ts` and `src/config/env.ts`, plus the check:secrets JWT shape. `gh` is called
  through an injected runner (stubbed in tests). Always exit 0.
- **Local unit results**: `UNIT_RUN_ARGS` exported by `scripts/ci-run-suite.ts`
  (`run --reporter=default --reporter=json --outputFile.json=reports/unit-results.json`) and the new
  `test:unit:report` script; the VS Code task "Tests: unit tests" uses it.
- **`.claude/skills/fix-failure/SKILL.md`**: the RF-97 steps; VS Code tasks "Tests: list last
  failures" and "Claude: analyze and fix last failure" (`claude "/fix-failure"`); README "When a
  test fails"; AGENTS.md command.

## Change after validation: local-only VS Code tasks and test:branch (clarifications 22 and 23)
- **`scripts/run-branch.ts`** (`npm run test:branch`): `worktreesDir(env)` (`TEST_BRANCH_WORKTREES`,
  else `%LOCALAPPDATA%`, else `~/.cache`, + `ecommerce-playwright-sdd/worktrees`); `runBranch(env, deps)`
  with injected `git`, `npm`, `runSelection(cwd)`, `files` (exists/read/copy/write) and
  `failureReport` dependencies (all stubbed in tests). Current branch from `git branch --show-current`.
  Other branch: `git fetch origin <b>` → `git worktree add --detach <dir> origin/<b>` or
  `git -C <dir> checkout --detach origin/<b>` → `git -C <dir> check-ignore -q .env` → copy `.env`
  → compare `package-lock.json` with `<dir>/.test-branch-lock.json` → `npm ci` (+ record) →
  selection with cwd `<dir>` (the main repo's compiled `dist/scripts/ci-run-suite.js`) →
  on red, `failureReport({ rootDir: <dir> })`. Reuses `selectRun` validation messages style.
- **`report:failures -- --branch <b>`**: `rootDir = worktreesDir()/<b>`.
- **VS Code**: GitHub tasks removed; "Tests: run locally on a branch (branch, layer, suite,
  browser)" → `npm run test:branch` with BRANCH/SUITE/BROWSER/LAYER.
- **Docs**: README "In VS Code" (local only, worktree location, manual cleanup with
  `git worktree remove <dir>`), "Manual pipeline run in GitHub" (web and CLI); AGENTS.md; skill note.

## Change after validation: local workers and bug-log columns (clarification 24)
- **`src/config/playwright-options.ts`**: `LOCAL_WORKERS = 2` and `resolveWorkers(env)` (`undefined`
  when `CI=true`, else 2), next to `resolveRetries()`; `buildPlaywrightConfig()` sets `workers` only
  when it is defined. Playwright's own `--workers` flag overrides the config, so no extra parsing.
- **`docs/bug-log.md`**: header `| Date | Bug / failure | Passed ✅ | Failed ❌ | Cause | Solution |`,
  legend rewritten, existing rows moved (where it failed → `Cause`, where it passed → `Solution`;
  dates from the run or commit of each row). AGENTS.md, the `/fix-failure` skill and the README
  name the new columns.

| Decision | Reason | Discarded alternative |
|----------|--------|-----------------------|
| Fixed limit of 2 local workers | The failing PC has 7.6 GB RAM; the failed tests passed with 2 workers; simple and predictable | A limit computed from free memory (varies between runs, hard to test) |
| CI unchanged | CI runners are sized for Playwright's default and all CI runs were green | One limit everywhere (slower CI for no reason) |
