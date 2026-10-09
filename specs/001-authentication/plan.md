# Plan — Spec 001 Authentication

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/001-authentication/spec.md · Test cases: specs/001-authentication/test-cases.md

## Context
This plan automates the 40 automated test cases of Spec 001 (UI login, API login, session, API
authorization and the two test-framework constraints RF-27 and RF-28) on top of the Spec 000
framework.

Main approach:
- **Reuse first.** Spec 000 already provides `LoginPage`, `AuthClient`, the fixtures in
  `src/fixtures/test.ts`, `requireEnv`, the timeouts, the URL builders and the config builder.
  This plan extends them rather than duplicating them.
- **New Page Objects.** A `DashboardPage` and a `NavBar` component hold the "Sign Out" control and
  the dashboard route.
- **New API pieces.** A `UserClient` covers the protected user endpoint, and a raw login call on
  `AuthClient` lets negative API tests read the status and body without throwing.
- **Sessions not under test come from the API.** The token from `POST /auth/login` is injected as
  browser storage state, so no password is typed in the browser outside TC-001-01 to TC-001-03.
- **RF-27 (no password in traces).** Tests that type a real password, or whose browser holds an
  auth token, declare `test.use(NO_TRACE)`. The fixtures that hand out these secrets refuse to run
  unless tracing is off.
- **RF-28 (wrong-password limit).** Every wrong password for a real account goes through one
  helper, `withWrongPassword()`. A static check, run by a unit test in the CI `unit` job, counts
  its call sites and enforces the limit.

## Constitution check
| # | Principle | Complies | Notes |
|---|-----------|----------|-------|
| 1 | Simple stack | ✔ | No new dependency. zod (schemas), typescript (compiler API for the RF-28 check) and Playwright are already installed. |
| 2 | Spec first | ✔ | Every test title starts with its TC ID. D-3 extended RF-27 to tests that hold a token (Mode C, approved; spec clarification 8). |
| 3 | Separation of concerns | ✔ | Locators live in `LoginPage`, `DashboardPage` and `NavBar`; HTTP in `AuthClient` and `UserClient`; test data in `src/data/auth-data.ts`. Tests only Arrange, Act and Assert. |
| 4 | Test quality | ✔ | Role-first locators; web-first assertions, `waitForURL` and `waitForResponse`; no hard waits; every test is independent, with its own session. |
| 5 | Data and secrets | ✔ | Nothing is created on the shop, so no cleanup is needed. Credentials only come from `requireEnv`. Tokens and passwords are never logged or attached. Unit tests run local fixtures only. |
| 6 | Language | ✔ | All code, comments, titles and messages are in English. |

## Coverage map
| RF | Test cases | Layer | Test file |
|----|------------|-------|-----------|
| RF-1, RF-2, RF-3, RF-7, RF-9, RF-11, RF-27 | TC-001-01, TC-001-02, TC-001-03 | ui | tests/ui/auth-form-login.spec.ts |
| RF-3, RF-12, RF-20 | TC-001-05 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-4, RF-5, RF-9 | TC-001-06, TC-001-07, TC-001-08 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-6, RF-9 | TC-001-09 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-1, RF-2, RF-6, RF-7, RF-8, RF-9 | TC-001-10 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-8, RF-9 | TC-001-11 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-10 | TC-001-12, TC-001-13 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-9, RF-11 | TC-001-14, TC-001-15 | mocked | tests/mocked/auth-login-api-failure.spec.ts |
| RF-3 | TC-001-04 | ui | tests/ui/auth-session.spec.ts |
| RF-12 | TC-001-16 | ui | tests/ui/auth-session.spec.ts |
| RF-20, RF-21, RF-23 | TC-001-27 | ui | tests/ui/auth-session.spec.ts |
| RF-21 | TC-001-28 | ui | tests/ui/auth-session.spec.ts |
| RF-22 | TC-001-29, TC-001-30 | ui | tests/ui/auth-session.spec.ts |
| RF-23 | TC-001-31 | ui | tests/ui/auth-login-validation.spec.ts |
| RF-23 | TC-001-32 | ui | tests/ui/auth-session.spec.ts |
| RF-13 to RF-17, RF-19 | TC-001-17 | api | tests/api/auth-login-api.spec.ts |
| RF-13 | TC-001-18 | api | tests/api/auth-login-api.spec.ts |
| RF-13, RF-14, RF-28 | TC-001-19 | api | tests/api/auth-login-api.spec.ts (own describe, retries 0) |
| RF-13, RF-14, RF-18 | TC-001-20 | api | tests/api/auth-login-api.spec.ts |
| RF-15, RF-16 | TC-001-21, TC-001-22, TC-001-23 | api | tests/api/auth-login-api.spec.ts |
| RF-17 | TC-001-24 | api | tests/api/auth-login-api.spec.ts |
| RF-18 | TC-001-25 | api | tests/api/auth-login-api.spec.ts |
| RF-19 | TC-001-26 | api | tests/api/auth-login-api.spec.ts |
| RF-24, RF-25, RF-26 | TC-001-33, TC-001-34, TC-001-35, TC-001-36 | api | tests/api/user-authorization.spec.ts |
| RF-27 | TC-001-37, TC-001-38 | unit | tests/unit/reporting/no-trace.test.ts (fixture project tests/fixtures/playwright/no-trace/) |
| RF-27 | TC-001-39 (manual) | integration | validation.md (check:secrets job of the pipeline that ran the auth suite) |
| RF-28 | TC-001-40, TC-001-41 | unit | tests/unit/security/wrong-password-limit.test.ts (fixture tests/fixtures/wrong-password/) |

TC-001-05 and TC-001-31 live in `auth-login-validation.spec.ts`, not `auth-session.spec.ts`,
because they need no session and may keep their trace on first retry.

## Page Objects and components
| Class | File | Responsibility | Key locators (by priority) |
|-------|------|----------------|----------------------------|
| LoginPage (REUSED, extended) | src/pages/login-page.ts | Existing `open()` plus:<ul><li>`fillCredentials()`, `submit()` and `login(credentials)` (covers RF-1, RF-2, RF-4 to RF-8);</li><li>`loginWithKeyboard(credentials)`: focus email, type, Tab, type, Enter, with no pointer (TC-001-03);</li><li>locators for the three validation messages and the alert;</li><li>`recordDialogs()`, which collects and dismisses any browser dialog (TC-001-10, TC-001-11).</li></ul> | Existing inputs and button; `getByText(LOGIN_MESSAGES.EMAIL_REQUIRED, { exact: true })` and the same for the password-required and valid-email messages; `getByRole('alert').filter({ hasText: LOGIN_MESSAGES.INCORRECT_CREDENTIALS })` — the role is confirmed in the spec, TODO: VERIFY whether the toast has an accessible name |
| login-page.constants.ts (REUSED, extended) | src/pages/login-page.constants.ts | Adds `LOGIN_MESSAGES` with the 4 texts of RF-4 to RF-7 | — |
| NavBar (NEW) | src/components/nav-bar.ts | Header controls of a logged-in customer (covers RF-3, RF-9, RF-21) | `getByRole('button', { name: NAV_BAR.SIGN_OUT, exact: true })`; `getByRole('button', { name: NAV_BAR.CART })` — TODO: VERIFY name, the button contains a counter, needed only for TC-001-30 |
| DashboardPage (NEW) | src/pages/dashboard-page.ts | `open()`; `navBar`; `url`; `clearStoredSession()`, which removes the stored token (TC-001-32) | Through `NavBar`; route checked with `expect(page).toHaveURL(DASHBOARD_ROUTE_PATTERN)` |

Route constants are added to `src/config/urls.ts`:
- `DASHBOARD_ROUTE = '#/dashboard'` and `buildDashboardUrl(baseUrl)`;
- `LOGIN_ROUTE_PATTERN` and `DASHBOARD_ROUTE_PATTERN`, regexes matching the hash routes of the spec's shared definitions.

## API clients and schemas
| Client / schema | File | Endpoints / contract |
|-----------------|------|----------------------|
| AuthClient (REUSED, extended) | src/api/auth-client.ts | `login()` is unchanged (Spec 000 sanity). New methods:<ul><li>`postLogin(body: unknown): Promise<ApiResult>`, which sends any body and returns `{ status, json }` without throwing, for RF-14 to RF-19;</li><li>`loginSession(credentials): Promise<AuthSession>`, which returns `{ token, userId }` validated by `authLoginSuccessSchema`, for RF-13 and the API sessions.</li></ul> The request body is never logged. |
| UserClient (NEW) | src/api/user-client.ts | `getCartCount(userId, authorization?: string): Promise<ApiResult>` → `GET {API_BASE_URL}/user/get-cart-count/{userId}`. The `Authorization` header is sent exactly as given, with no `Bearer`; it is omitted when `undefined` and sent empty when `''` (RF-24 to RF-26). |
| ApiResult, ApiRequestContext (NEW) | src/api/api-result.ts | `ApiResult = { status: number; json: unknown }`, parsed with a `text()` and JSON fallback (a non-JSON body gives `json: undefined`). `ApiRequestContext` is the subset of Playwright's `APIRequestContext` with `post` and `get`, so a stub satisfies it. `LoginRequestContext` stays as is. |
| auth-login schemas (NEW) | src/api/schemas/auth-login.schema.ts | `authLoginSuccessSchema`: `token` is a non-empty string, `userId` is a non-empty string and `message` is the literal "Login Successfully" (RF-13). `apiMessageSchema`: `{ message: string }`, for the 400 and 401 bodies (RF-14 to RF-16, RF-19, RF-25, RF-26). Expected messages are constants in `src/api/auth-messages.ts`. |

`src/api/schemas/login-response.schema.ts` (Spec 000) is not changed.

## Fixtures and test data
Fixtures, added to `src/fixtures/test.ts` (REUSED):
- `accountB`: `TEST_USER_2_EMAIL` / `TEST_USER_2_PASSWORD`. The existing `accountA` and `authClient` are reused.
- `userClient` and `dashboardPage`.
- `formAccountA` and `formAccountB`: credentials meant to be typed into the browser. The fixture
  depends on Playwright's `trace` option and throws "Typing a real password requires trace off
  (Spec 001 RF-27)" unless the mode is `off`. A test cannot type a real password while tracing,
  even by mistake (covers RF-27, TC-001-01 to TC-001-03).
- `apiSession`: `{ token, userId }` of account A from `authClient.loginSession(accountA)`. Each
  test gets its own login, so tests stay independent.
- `NO_TRACE = { trace: 'off' } as const`, exported. A test file declares, at its top level,
  `test.use(NO_TRACE)` (RF-27). `trace` is a worker option, so Playwright refuses it inside a describe (found in T7).
- `loggedInTest = test.extend(...)`: overrides `storageState` with the `apiSession` token in local
  storage for the `BASE_URL` origin, under the key `SESSION_STORAGE_KEY`. That key is `'token'`,
  observed on the site — TODO: VERIFY that it is enough for every route. Storage state is applied
  once, when the context is created, so Sign Out, the removal of the token and Back behave like a
  real browser. It also requires trace off (see D-3) (covers RF-3, RF-12, RF-20 to RF-23).

Test data in `src/data/auth-data.ts` (NEW):
- `UNKNOWN_EMAIL = 'TEST_nobody@example.test'`, `TEST_PASSWORD = 'TEST_pass_x'`,
  `INVALID_EMAILS` (3 values) and `INJECTION_INPUTS` (the closed list from the spec, verbatim).
- `withWrongPassword(account)`: returns `{ email: account.email, password: 'TEST_wrong_pass' }`. It is the only allowed way to build a wrong password for a real account (RF-28).
- `emailOfLength(n)` and `valueOfLength(n)`: `TEST_` + filler (+ `@example.test`) of exactly `n` characters (TC-001-25).
- `tamperToken(token)`: replaces the last 4 characters with `AAAA` (TC-001-35). `MALFORMED_AUTHORIZATION = ['TEST_not_a_token', '']` (TC-001-36).
- `untrimmed(email)` and `upperCased(email)` (TC-001-26).

Accounts and cleanup:
- Accounts: only A and B. Account B is used only by TC-001-02, TC-001-03 and TC-001-18.
- No data is created on the shop, so no cleanup is needed.

## Mocking strategy
- **Mocked UI** (TC-001-14, TC-001-15): `page.route('**/auth/login', ...)` answers only `POST`, with
  `route.fulfill({ status: 500 | 503 })` or `route.abort('failed')`. Other requests reach the real
  site, so the real login page loads. The test waits for the mocked exchange
  (`page.waitForResponse` for 5xx, `page.waitForEvent('requestfailed')` for the abort) before it
  asserts the login route and the absence of Sign Out. This way it never passes just because the
  app had not reacted yet. Only `TEST_` credentials are typed.
- **Unit tests** (TC-001-37, 38, 40, 41) make no HTTP call.
  - The tracing fixture project uses `page.setContent` only, with `TEST_` values passed through the
    child environment by `runPlaywright` (the Spec 000 helper).
  - The RF-28 check reads source files from disk.
- **Real environment:**
  - every `tests/ui` and `tests/api` test of this spec;
  - the network block for unit tests (Spec 000, RF-6) stays in force.

## Locator strategy
- The login inputs and button keep their Spec 000 role and name locators: placeholders are the
  accessible names, and the password input is a `textbox` with the placeholder typo "passsword".
- The validation messages use `getByText` with constants (`exact: true`), because they have no
  role.
- The wrong-credentials toast uses `getByRole('alert')`, filtered by text. TODO: VERIFY on all
  three browsers.
- "Sign Out" uses `getByRole('button', { name: 'Sign Out', exact: true })`, per the spec's shared
  definition.
- Masking (RF-10) is asserted with `toHaveAttribute('type', 'password')`. This is the only
  observable proof of masking, because the masked glyphs are not exposed to the DOM.
- No CSS selector is planned. If the Cart control of TC-001-30 has no stable accessible name, a
  route change via `page.goto(buildDashboardUrl(...)/cart)` replaces the click. That route is TODO:
  VERIFY, observed as `#/dashboard/cart`.

## Test file layout, tags and browsers

**tests/ui/auth-form-login.spec.ts**
- `test.use(NO_TRACE)` at file level.
- `positive`: TC-001-01 (`@smoke @regression @ui @critical`), TC-001-02 and TC-001-03 (`@regression @ui`).

**tests/ui/auth-login-validation.spec.ts** (trace stays on-first-retry: no secret is in the browser)
- `negative`: TC-001-06, 07, 09, 10, 13. TC-001-10 is `@critical`.
- `boundary`: TC-001-08.
- `security`: TC-001-11 (`@critical`), TC-001-12 and TC-001-31 (`@critical`).
- `negative` (session): TC-001-05.

**tests/mocked/auth-login-api-failure.spec.ts**
- `negative`: TC-001-15.
- `boundary`: TC-001-14 (500 and 503 in one test, re-opening the page per status).
- Tags: `@regression @mocked`.

**tests/ui/auth-session.spec.ts**
- Uses `loggedInTest` and `test.use(NO_TRACE)`.
- `positive`: TC-001-04, 16, 27, 28 (`@critical`).
- `security`: TC-001-29 (`@critical`).
- `negative`: TC-001-30.
- `boundary`: TC-001-32.

**tests/api/auth-login-api.spec.ts**
- `positive`: TC-001-17 (`@critical`) and 18.
- `negative`: TC-001-20, 21, 22.
- `boundary`: TC-001-23, 25, 26.
- `security`: TC-001-24 (`@critical`).
- A separate describe `wrong password for a real account` with `test.describe.configure({ retries: 0 })` holds only TC-001-19 (`@critical`) (RF-28).

**tests/api/user-authorization.spec.ts**
- `positive`: TC-001-33 (`@smoke @regression @api @critical`).
- `security`: TC-001-34 and 35 (`@critical`).
- `boundary`: TC-001-36.

**Unit tests**
- `tests/unit/reporting/no-trace.test.ts`: TC-001-37 and TC-001-38.
- `tests/unit/security/wrong-password-limit.test.ts`: TC-001-40 and TC-001-41.

Loops and helpers:
- Multi-value TCs (09, 11, 14, 23, 24, 25, 26, 36) loop over their data inside one test. A
  generated title would not be a plain string literal, and spec:check could not read it.
- Each assertion message names the value without printing secrets.

Browsers:
- UI and mocked tests: chromium, firefox and webkit; msedge only on explicit local request.
- API tests: the `api` project.
- Smoke: TC-001-01 runs on chromium and TC-001-33 in `api`. They join the Spec 000 sanity tests in
  the eyter_dev and production gates.

## Technical decisions
| ID | Decision | Reason | Discarded alternative |
|----|----------|--------|-----------------------|
| D-1 | API sessions through `storageState` (local storage `token`) in a `loggedInTest` fixture | It is applied once, at context creation, so Sign Out, the removal of the token and Back behave exactly as in a real browser | `addInitScript` re-inserts the token on every navigation, which would make TC-001-29 and TC-001-32 pass falsely. Logging in through the form types a password (RF-27) |
| D-2 | `test.use(NO_TRACE)`, plus fixtures (`formAccountA`/`formAccountB`, `loggedInTest`) that refuse to run unless `trace` is `off` | It marks the tests that hold secrets at file level with the standard Playwright option, and the guard turns a forgotten mark into a clear failure instead of a leaked secret | A tag plus extra projects with `grep`, which would double the browser projects and break `ci:run-suite` project selection. A naming convention, which nothing enforces |
| D-3 | **Approved; RF-27 updated (spec clarification 8).** Tests whose browser holds the API token (`auth-session.spec.ts`) also record no trace | The app sends the token in its API calls, so a trace of a retried logged-in test contains it, and `check:secrets` fails the pipeline on any token-shaped value (Spec 000 RF-23). RF-27 names only real passwords. If approved, RF-27 gets a one-line Mode C clarification: "tests that type a real password or hold an auth token in the browser". | Keep traces and redact them, which requires rewriting zipped traces. Accept a failing `check:secrets` whenever such a test retries |
| D-4 | Raw `postLogin(body)` and `getCartCount()` returning `{ status, json }` | Negative API tests must inspect 4xx bodies. The Spec 000 `login()` throws on non-200 on purpose and stays as it is | A `throwOnError` flag on `login()`, which would mix two contracts in one method |
| D-5 | RF-28 enforced statically:<ul><li>`scripts/check-wrong-password.ts` exports `findWrongPasswordViolations(files)`, which uses the TypeScript compiler API like `scan-titles.ts`;</li><li>it counts `withWrongPassword(...)` calls per test, the account argument, the folder (`tests/api/` only) and the enclosing `describe.configure({ retries: 0 })`;</li><li>a unit test runs it on the repository (TC-001-40) and on a fixture (TC-001-41), so the CI `unit` job is the gate.</li></ul> | A cheap, deterministic, network-free check, and no new npm script or CI job | A runtime counter across workers, which cannot see retries in other processes. A regex scan, which cannot tell which test a call belongs to |
| D-6 | One API login per logged-in test (test-scoped `apiSession`) | Independent tests, no shared state | A worker-scoped token cache, with fewer requests but state shared between tests. Revisit only if rate limiting appears |
| D-7 | Multi-value cases loop inside one test | spec:check reads only literal titles, and the TC is the unit of traceability | Generated titles per value (`${value}`), which spec:check cannot read |
| D-8 | Keyboard login focuses the email input with `locator.focus()`, then uses only Tab, typing and Enter | `focus()` is not a pointer action. The number of Tabs from the page start depends on the header and is not stable across browsers | Pressing Tab from `body` a fixed number of times. TODO: VERIFY in validation that the Tab order email → password → Login holds on all browsers |
| D-9 | **Added in T9; confirmed by the user, TC-001-03 updated (Mode C).** Real passwords are entered with `enterSecret()` (a `locator.evaluate` that sets the value and dispatches `input` and `change`), never with `fill`, `type` or `keyboard.type` | Playwright titles those steps after the typed text (`Fill "<value>"`), and the HTML and JSON reports keep the titles even with tracing off: the first T9 run put both real passwords in `playwright-report/` and `check:secrets` failed. An `evaluate` step is titled "Evaluate" only | `fill` with tracing off (leaks through report step titles). Pressing one key per character (leaks the password one character per step). Post-processing the reports (rewriting the embedded zip) |

## Risks
- **Token in traces (D-3).** Without the decision, a retried logged-in UI test fails
  `check:secrets` in CI. Mitigation: trace off for those tests, plus the fixture guard.
  Screenshots and video stay off (the Spec 000 default).
- **Account A gets locked or its password is changed** by a third party on the shared demo site.
  TC-001-01, TC-001-17, TC-001-33 and every logged-in test fail together. Mitigation: only one
  wrong-password login per run (RF-28). The README gets a "Test account recovery" note, which is
  the documentation the spec's edge case asks for.
- **Rate limiting.**
  - Volume: about 9 logged-in tests × 3 browsers, plus about 12 API logins, per regression run.
  - Mitigation: few CI workers; D-6 can switch to a worker-scoped token if HTTP 429 appears.
- **The toast is transient.** It is asserted only for RF-7, with a web-first assertion within 30 s,
  right after the submit.
- **Mocked failure assertions.** They wait for the mocked response or request failure, so they do
  not pass before the app has reacted.
- **Unverified UI details** (the `TODO: VERIFY` items):
  - the toast's accessible name;
  - the Cart control and route;
  - the storage key;
  - the Tab order;
  - the exact messages of TC-001-23 and TC-001-36.
  Each is checked live in the task that uses it. A difference from the spec is reported as a
  possible defect and the assertion is not weakened.
- **The fixture run (TC-001-37/38) spawns Playwright,** like TC-000-41, which is slow under local
  load. It uses `CLI_TEST_TIMEOUT_MS`, and chromium only.

## Out of scope
- Everything in the spec's "Out of scope":
  - registration, password recovery and isolation between accounts A and B;
  - real session expiry, "remember me", lockout, double submit, multi-tab Sign Out and rate limiting.
- The known shop issues: unlinked labels and tokens still valid after Sign Out. They have no tests.
- Changes to the Spec 000 sanity tests, `login()` and the CI pipeline. The new tests are picked up
  by the existing gates through their tags.
- TC-001-39 is manual: it is recorded in validation.md from the pipeline's `check:secrets` job.
