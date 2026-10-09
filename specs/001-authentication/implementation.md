# Implementation Log — Spec 001 Authentication

Spec: specs/001-authentication/spec.md · Tasks: specs/001-authentication/tasks.md

## T1 — Add the login API contract and the raw login call, with the positive API tests

Date: 2026-10-08 · Covers: RF-13 / TC-001-17, TC-001-18

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/auth-login-api.spec.ts | NEW | TC-001-17, TC-001-18 |
| src/api/api-result.ts | NEW | `HTTP_STATUS`, `ApiResult`, `ApiRequestContext`, `toApiResult` (status + parsed body, no throw) |
| src/api/auth-messages.ts | NEW | API messages named by RF-13 to RF-16, RF-19, RF-25, RF-26 |
| src/api/schemas/auth-login.schema.ts | NEW | `authLoginSuccessSchema` (RF-13), `apiMessageSchema` |
| src/api/auth-client.ts | UPDATED | `toLoginBody`, `postLogin(body)`, `loginSession(credentials)`; `login()` unchanged |
| src/errors/messages.ts | UPDATED | `loginSessionFailedMessage(status)` for `loginSession()`. Not listed in the task's Files; added because every framework message lives here (Spec 000 RF-21) |
| src/fixtures/test.ts | UPDATED | `accountB` fixture |

### Test run
Command: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-1[78]" --project=api`
Result: 2 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-001-17/18 pass (2 tests) and the Spec 000 sanity `tests/api/auth-login.spec.ts` still passes | PASS (2 passed; TC-000-80 1 passed) |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS (warnings only for Spec 001 TCs not implemented yet) |

### Assumptions and findings
- None. The live API answered exactly as RF-13 states for both accounts.

## T2 — Test API login rejection for unknown accounts and missing or empty fields

Date: 2026-10-08 · Covers: RF-14, RF-15, RF-16 / TC-001-20, TC-001-21, TC-001-22, TC-001-23

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/auth-login-api.spec.ts | UPDATED | TC-001-20 to TC-001-23; `expectRejected()` helper (status, message, no token) |
| src/data/auth-data.ts | NEW | `UNKNOWN_EMAIL`, `TEST_PASSWORD` |

### Test run
Command: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-2[0-3]" --project=api`
Result: 4 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-2[0-3]" --project=api` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (TC-001-23): an empty `userEmail` answers 400 "Email is required" and an
  empty `userPassword` answers 400 "Password is required", the same as a missing field. The test
  asserts these exact messages.

## T3 — Test API login with injection-style, over-long and non-exact emails

Date: 2026-10-08 · Covers: RF-17, RF-18, RF-19 / TC-001-24, TC-001-25, TC-001-26

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/auth-login-api.spec.ts | UPDATED | TC-001-24, TC-001-25, TC-001-26; `expectClientError()` helper (400–499, no token) |
| src/data/auth-data.ts | UPDATED | `INJECTION_INPUTS` (the spec's closed list), `MAX_FIELD_LENGTH`, `valueOfLength`, `emailOfLength`, `untrimmed`, `upperCased`; reuses `TEST_DATA_PREFIX` from the Spec 000 factory |

### Test run
Command: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-2[4-6]" --project=api`
Result: 3 passed · 0 failed · 0 skipped (api); whole file 9 passed

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-2[4-6]" --project=api` passes (3 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- TC-001-26 first asserts that each non-exact form differs from the stored email; otherwise an
  email already in upper case would make the case prove nothing.
- Multi-value cases run their requests in parallel inside one test (plan D-7); each assertion
  names its case. Injection values are not secrets, so labels may show them.

## T4 — Add the wrong-password helper and the single wrong-password API test

Date: 2026-10-08 · Covers: RF-14, RF-28 / TC-001-19

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/auth-login-api.spec.ts | UPDATED | TC-001-19 in its own describe with `test.describe.configure({ retries: 0 })` |
| src/data/auth-data.ts | UPDATED | `withWrongPassword(account)`: real email + `TEST_wrong_pass`; the only allowed way to build a wrong password for a real account (RF-28) |

### Test run
Command: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-19" --project=api`
Result: 1 passed · 0 failed · 0 skipped (api). Also run with `CI=true` (retries 2 elsewhere): the test ran once.

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-19" --project=api` passes (1 test, run once) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- None. The wrong-password answer is identical to the unknown-account answer (RF-14).

## T5 — Enforce the wrong-password limit with a static check

Date: 2026-10-08 · Covers: RF-28 / TC-001-40, TC-001-41

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/security/wrong-password-limit.test.ts | NEW | TC-001-40 (repository), TC-001-41 (fixture) |
| scripts/check-wrong-password.ts | NEW | `collectSpecFiles`, `findWrongPasswordUses`, `findWrongPasswordViolations` (TypeScript compiler API, like `scan-titles.ts`) |
| tests/fixtures/wrong-password/tests/api/two-wrong.spec.ts | NEW | Two account A uses, the second without `retries: 0` |
| tests/fixtures/wrong-password/tests/ui/account-b.spec.ts | NEW | One account B use in a UI file |

### Test run
Command: `npx vitest run tests/unit/security/wrong-password-limit.test.ts -t "TC-001-4[01]"`
Result: 2 passed · 0 failed · 0 skipped (node)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx vitest run tests/unit/security/wrong-password-limit.test.ts -t "TC-001-4[01]"` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- Rules per call: the account argument must be the `accountA` fixture (account B or anything else
  is flagged), only one account A use in the repository, the file must be under `tests/api/`, an
  enclosing describe must set `retries: 0`, and the call must sit in a test with a literal title.
- No npm script or CI job was added: the CI `unit` job runs this test (plan D-5).

## T6 — Add the user client and the protected-endpoint authorization tests

Date: 2026-10-08 · Covers: RF-24, RF-25, RF-26 / TC-001-33, TC-001-34, TC-001-35, TC-001-36

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/api/user-authorization.spec.ts | NEW | TC-001-33 (@smoke), TC-001-34, TC-001-35, TC-001-36 |
| src/api/user-client.ts | NEW | `getCartCount(userId, authorization?)`; header sent as given, omitted when undefined |
| src/data/auth-data.ts | UPDATED | `tamperToken`, `MALFORMED_AUTHORIZATION` |
| src/fixtures/test.ts | UPDATED | `userClient`, `apiSession` (account A token and userId, one login per test) |
| src/config/urls.ts | UPDATED | `USER_CART_COUNT_PATH`, `buildCartCountUrl`. Not listed in the task's Files; URL builders live here (Spec 000) |

### Test run
Command: `npx playwright test tests/api/user-authorization.spec.ts --grep "TC-001-3[3-6]" --project=api`
Result: 4 passed · 0 failed · 0 skipped (api)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/api/user-authorization.spec.ts --grep "TC-001-3[3-6]" --project=api` passes (4 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- TODO: VERIFY resolved (TC-001-36), probed live with statuses and messages only:
  `Authorization: TEST_not_a_token` → 401 "Session Timeout"; an empty `Authorization` → 401
  "Access denied. No token provided." (same as no header). The test asserts these exact messages.
- The tampered-token check compares as a boolean, so a failure never prints the token.

## T7 — Add `NO_TRACE` and the form-credential fixtures that require tracing off

Date: 2026-10-08 · Covers: RF-27 / TC-001-37, TC-001-38

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/unit/reporting/no-trace.test.ts | NEW | TC-001-37, TC-001-38 (fixture run in CI mode, chromium) |
| src/fixtures/test.ts | UPDATED | `NO_TRACE`; `formAccountA` / `formAccountB`, which throw unless `trace` is `off` |
| src/errors/messages.ts | UPDATED | `traceMustBeOffMessage(fixture, mode)`. Not listed in the task's Files; framework messages live here |
| tests/fixtures/playwright/no-trace/playwright.config.ts | NEW | Fixture project built with the real config builder |
| tests/fixtures/playwright/no-trace/ui/marked.spec.ts | NEW | File-level `test.use(NO_TRACE)`; types the `formAccountA` password (TEST_ value); fails once |
| tests/fixtures/playwright/no-trace/ui/unmarked.spec.ts | NEW | Holds no secret; fails once |
| specs/001-authentication/plan.md | UPDATED | `NO_TRACE` is applied at file level, not per describe (finding below) |

### Test run
Command: `npx vitest run tests/unit/reporting/no-trace.test.ts -t "TC-001-3[78]"`
Result: 2 passed · 0 failed · 0 skipped (node; fixture runs on chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-001-37/38 pass (2 tests) and `tests/unit/reporting/tracing.test.ts` still passes | PASS (2 passed; tracing 2 passed) |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- First run failed: Playwright rejects `test.use({ trace })` inside a describe ("forces a new
  worker"), because `trace` is a worker option. `NO_TRACE` is therefore applied at the top of a
  test file. The fixture was split into a marked and an unmarked file, and plan.md was corrected.
  The planned test files (`auth-form-login.spec.ts`, `auth-session.spec.ts`) already used file level.

## T8 — Add NavBar, DashboardPage and the dashboard route, with the guest-session tests

Date: 2026-10-08 · Covers: RF-3, RF-12, RF-20, RF-23 / TC-001-05, TC-001-31

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-login-validation.spec.ts | NEW | TC-001-05, TC-001-31 |
| src/components/nav-bar.ts | NEW | `NavBar.signOutButton` (role button, name "Sign Out") |
| src/pages/dashboard-page.ts | NEW | `DashboardPage.open()`, `navBar`, `url` |
| src/config/urls.ts | UPDATED | `DASHBOARD_ROUTE`, `buildDashboardUrl`, `LOGIN_ROUTE_PATTERN`, `DASHBOARD_ROUTE_PATTERN` |
| src/fixtures/test.ts | UPDATED | `dashboardPage`, `navBar`. `navBar` was not in the plan; it lets a test check Sign Out on whichever page is open (TC-001-05 is on the login page) |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-login-validation.spec.ts --grep "TC-001-(05|31)" --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-(05|31)" --project=chromium` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- Live UI check (2026-10-08, chromium; URLs, roles and names only, no secrets printed):
  - a guest opening `#/dashboard` is redirected to `#/auth/login`;
  - with a session, `#/dashboard` lands on `#/dashboard/dash`, so the route patterns match a URL
    containing `#/dashboard` as the spec defines;
  - header buttons: HOME, ORDERS, Cart, Sign Out;
  - local storage holds a single key, `token`;
  - the login route opened with a session redirects to `#/dashboard/dash`.
- On Windows, `npx` passes the `|` of the grep pattern to `cmd`, which splits the command; the
  Playwright CLI is run with `node` directly. CI (Linux) is not affected.
- Absence checks wait for a positive state first (the Login button), so `toBeHidden()` on Sign Out
  cannot pass before the page has rendered.

## T9 — Extend LoginPage and test the form login with accounts A and B

Date: 2026-10-08 · Covers: RF-1, RF-2, RF-3, RF-27 / TC-001-01, TC-001-02, TC-001-03

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-form-login.spec.ts | NEW | TC-001-01 (@smoke), TC-001-02, TC-001-03; file-level `test.use(NO_TRACE)` |
| src/pages/login-page.ts | UPDATED | `fillCredentials`, `submit`, `login`, `typeEmailAndTab`, `enterPasswordAndPressEnter`, `incorrectCredentialsAlert`; `enterSecret()` for real passwords |
| src/pages/login-page.constants.ts | UPDATED | `LOGIN_MESSAGES` (RF-4 to RF-7). Planned for T10/T11; added now because TC-001-01 asserts the alert is absent |
| specs/001-authentication/plan.md | UPDATED | Decision D-9 (below) |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-form-login.spec.ts --grep "TC-001-0[1-3]" --project=chromium`
Result: 3 passed · 0 failed · 0 skipped (chromium); 0 `trace.zip` under test-results/; `npm run check:secrets` passed

### Quality gates
| Gate | Result |
|------|--------|
| Done when: TC-001-01 to TC-001-03 pass on chromium (3 tests) and no `trace.zip` exists for them | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- **Secret leak found and fixed (RF-27).** The first run passed with no trace, but `check:secrets`
  failed: `playwright-report/index.html` contained both real passwords. Playwright titles the
  steps of `fill`, `type` and `keyboard.type` after the typed text (`Fill "<value>"`), and the HTML
  and JSON reports keep those titles even with tracing off. Fix (plan D-9): real passwords go in
  through `enterSecret()`, a `locator.evaluate` step titled just "Evaluate" that sets the value and
  dispatches `input` and `change`. After the fix, `check:secrets` passed.
- **Needs user confirmation (TC-001-03).** The keyboard-only test reaches every field with Tab,
  types the email with the keyboard, asserts the focus moved to the password field, and submits
  with Enter, but the password itself is set by `enterSecret()`, not typed key by key. TC-001-03's
  test data says "only Tab, typing and Enter". Typing the password would put it in the report.
- The alert locator uses the verified role `alert` and accessible name "Incorrect email or password.".

## T10 — Test the client-side validation messages and the input masking

Date: 2026-10-08 · Covers: RF-4, RF-5, RF-6, RF-9, RF-10 / TC-001-06, TC-001-07, TC-001-08, TC-001-09, TC-001-12, TC-001-13

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-login-validation.spec.ts | UPDATED | TC-001-06, 07, 09, 13 (negative), 08 (boundary), 12 (security) |
| src/pages/login-page.ts | UPDATED | `emailRequiredMessage`, `passwordRequiredMessage`, `validEmailMessage` (`getByText`, exact, from constants) |
| src/data/auth-data.ts | UPDATED | `INVALID_EMAILS`. Not listed in the task's Files; test data lives here |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-login-validation.spec.ts --grep "TC-001-(0[6-9]|1[23])" --project=chromium`
Result: 6 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-(0[6-9]|1[23])" --project=chromium` passes (6 tests) | PASS |
| Test review checklist | PASS (TC-001-09 was restructured so each value has its own Act and Assert) |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- The validation messages have no role, so they use `getByText` with exact constants, as the plan states.
- Only TEST_ values are typed in this file, so `fill` is safe here and the file keeps its trace on first retry.

## T11 — Test the wrong-credentials alert and injection-style input in the form

Date: 2026-10-08 · Covers: RF-7, RF-8, RF-9 / TC-001-10, TC-001-11

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-login-validation.spec.ts | UPDATED | TC-001-10 (negative), TC-001-11 (security) |
| src/pages/login-page.ts | UPDATED | `recordDialogs()` (records and dismisses any browser dialog). `incorrectCredentialsAlert` was already added in T9 |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-login-validation.spec.ts --grep "TC-001-1[01]" --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-1[01]" --project=chromium` passes (2 tests); alert role and name verified | PASS |
| Test review checklist | PASS (two `no-conditional-in-test` lint warnings removed by turning TC-001-11 into a case table) |
| Lint | PASS (0 warnings) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- TODO: VERIFY resolved: the toast is `<div role="alert" aria-label="Incorrect email or password.">`,
  visible about 1.3 s (verified 2026-10-08). It is asserted with a web-first check within the
  30 s budget of RF-7, right after the submit.
- First TC-001-11 run failed with a strict-mode violation: two alerts at once. `open()` changes
  only the hash route, so the previous value's toast was still on screen. Each case now first
  waits until no alert is left. This is a test-isolation fix, not an app defect.
- Email-field injection values fail client validation ("*Enter Valid Email"); password-field
  values reach the server and get the wrong-credentials alert. No value opened a dialog.

## T12 — Test the login form against a failing or silent login API

Date: 2026-10-08 · Covers: RF-9, RF-11 / TC-001-14, TC-001-15

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/mocked/auth-login-api-failure.spec.ts | NEW | TC-001-14 (500 and 503), TC-001-15 (request aborted) |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/mocked/auth-login-api-failure.spec.ts --grep "TC-001-1[45]" --project=chromium`
Result: 2 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/mocked/auth-login-api-failure.spec.ts --grep "TC-001-1[45]" --project=chromium` passes (2 tests) | PASS |
| Test review checklist | PASS |
| Lint | PASS (0 warnings) |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- Only the API call is mocked (`**/auth/login`). The page route `/client/#/auth/login` never
  matches, because a hash is not part of a request URL, so the real login page loads.
- Each test waits for the mocked exchange (`waitForResponse` with the mocked status, or
  `requestfailed`) before asserting, so it cannot pass before the app has reacted.

## T13 — Add the API-session fixture and test the session in the UI

Date: 2026-10-08 · Covers: RF-3, RF-12, RF-20 / TC-001-04, TC-001-16, TC-001-27

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-session.spec.ts | NEW | TC-001-04, TC-001-16, TC-001-27; file-level `test.use(NO_TRACE)` |
| src/fixtures/test.ts | UPDATED | `SESSION_STORAGE_KEY = 'token'`; `loggedInTest` overrides `storageState` with the `apiSession` token for the BASE_URL origin, and requires trace off |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-session.spec.ts --grep "TC-001-(04|16|27)" --project=chromium`
Result: 3 passed · 0 failed · 0 skipped (chromium); `npm run check:secrets` passed on the artifacts

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/auth-session.spec.ts --grep "TC-001-(04|16|27)" --project=chromium` passes (3 tests); storage key verified | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- TODO: VERIFY resolved: the shop keeps only `token` in local storage, and that key alone is
  enough for the dashboard, the reload and the login-route redirect (verified 2026-10-08).

## T14 — Test Sign Out and browser history before and after it

Date: 2026-10-08 · Covers: RF-21, RF-22 / TC-001-28, TC-001-29, TC-001-30

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-session.spec.ts | UPDATED | TC-001-28 (positive), TC-001-29 (security), TC-001-30 (negative) |
| src/components/nav-bar.ts | UPDATED | `cartButton`, `signOut()`, `openCart()` |
| src/config/urls.ts | UPDATED | `CART_ROUTE_PATTERN`. Not listed in the task's Files; route constants live here |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-session.spec.ts --grep "TC-001-(28|29|30)" --project=chromium`
Result: 3 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/auth-session.spec.ts --grep "TC-001-(28|29|30)" --project=chromium` passes (3 tests); second protected route verified | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- TODO: VERIFY resolved: the Cart button leads to `#/dashboard/cart` (verified 2026-10-08).
- First run of TC-001-30 timed out on the Cart button. Its accessible name is " Cart" (it starts
  with an icon-font glyph, not a space), and product cards have " Add To Cart" buttons. The name
  pattern is now `^\W*Cart\b`. This is a locator fix, not an app defect.
- TC-001-30 also asserts the URL is no longer the cart route, because the cart route itself
  contains `#/dashboard`.

## T15 — Test that removing the stored session sends the customer to login

Date: 2026-10-08 · Covers: RF-23 / TC-001-32

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| tests/ui/auth-session.spec.ts | UPDATED | TC-001-32 (boundary) |
| src/pages/dashboard-page.ts | UPDATED | `clearStoredSession()`; `SESSION_STORAGE_KEY` moved here from the fixtures |
| src/fixtures/test.ts | UPDATED | Imports `SESSION_STORAGE_KEY` from the page object. The page needs the key, and pages must not import the fixtures, because the fixtures import the pages |

### Test run
Command: `node node_modules/@playwright/test/cli.js test tests/ui/auth-session.spec.ts --grep "TC-001-32" --project=chromium`
Result: 1 passed · 0 failed · 0 skipped (chromium)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: `npx playwright test tests/ui/auth-session.spec.ts --grep "TC-001-32" --project=chromium` passes (1 test) | PASS |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |
| spec:check | PASS |

### Assumptions and findings
- None. Removing `token` from local storage and reloading lands on `#/auth/login`, as RF-23 states.

## T16 — Run the suite on all browsers, scan the artifacts and update the traceability matrix

Date: 2026-10-08 · Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; RF-27 scan)

### Files changed
| File | Change | Purpose |
|------|--------|---------|
| README.md | UPDATED | Test account recovery (accounts A and B, RF-28 limit), real secrets in the browser (`NO_TRACE`, `enterSecret`), Windows `|` patterns for Vitest and Playwright |
| docs/traceability.md | REGENERATED | 258 rows; 82 Spec 001 rows; 0 `missing` |
| tests/ui/auth-form-login.spec.ts | UPDATED | The post-login URL checks use the 30 s navigation budget of the spec (`NAVIGATION_TIMEOUT_MS`) |
| tests/ui/auth-login-validation.spec.ts | UPDATED | TC-001-11 is marked `test.slow()`: six cases in one test |
| specs/001-authentication/test-cases.md | UPDATED | TC-001-03 test data and expected result (Mode C, approved by the user; plan D-9) |
| specs/000-framework-foundation/test-cases.md, tests/unit/playwright/projects.test.ts | UPDATED | TC-000-20 (Mode C on Spec 000, approved by the user): every listed test is tagged `@smoke`, instead of a fixed list of two |

### Test run
Command: `npx playwright test --grep "TC-001-" --project=api --project=chromium --project=firefox --project=webkit`,
run as three invocations to stay within local memory: `--project=api --project=chromium` (36),
`--project=firefox` (22) and `--project=webkit` (22), each with `--workers=2`.
Result: 80 passed · 0 failed · 0 skipped (api, chromium, firefox, webkit)

### Quality gates
| Gate | Result |
|------|--------|
| Done when: all TC-001 tests pass on api, chromium, firefox and webkit | PASS (80/80) |
| Done when: `npm run check:secrets` exits 0 on their artifacts | PASS (after each of the three invocations) |
| Done when: `npm run test:unit` passes | PASS (100/100) |
| Done when: `npm run spec:check -- --write` passes with no Spec 001 warning | PASS (0 warnings) |
| Test review checklist | PASS |
| Lint | PASS |
| typecheck | PASS |

### Assumptions and findings
- First full runs (all four projects in one invocation): local memory pressure crashed workers
  and browsers ("worker process exited unexpectedly", "Page crashed", "browser has been closed").
  One background run was stopped by Claude Code for low memory. Every test that failed this way
  passed when run alone.
- Firefox, TC-001-11: the six cases exceeded the 30 s per-test budget. Fixed with `test.slow()`.
- WebKit, TC-001-03 under load: the dashboard redirect after the login took longer than the
  default 5 s of `expect`. The post-login URL checks now use the spec's 30 s navigation budget.
  No assertion was weakened.
- Unit run: TC-000-20 (Spec 000) failed because it fixed the smoke inventory at two tests. It was
  updated with the user's approval (see the Spec 000 implementation log).
- TC-001-39 (manual) is recorded at validation from the pipeline's `check:secrets` job.
