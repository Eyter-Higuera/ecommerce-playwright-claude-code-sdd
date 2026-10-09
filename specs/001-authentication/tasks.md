# Tasks — Spec 001 Authentication

Status: approved
<!-- Allowed values: draft | approved -->
Spec: specs/001-authentication/spec.md · Plan: specs/001-authentication/plan.md

Rules:
- One task at a time, tests first, at most 20-30 minutes per task, in dependency order.
- A task is done only when its own TCs pass and the earlier tasks' tests still pass. Each task also
  runs `npm run lint`, `npm run typecheck` and `npm run spec:check`, and updates
  `execution-report.md`.
- Unit tests run with `npx vitest run <file> -t "<TC pattern>"`.
- Playwright tasks run on chromium (UI) or `api`. Firefox and webkit run in T16.
- The manual TC-001-39 is executed in the validation phase.
- Every `TODO: VERIFY` of the plan is checked live in the task that uses it. A difference from the
  spec is reported as a possible defect, and the assertion is not weakened.

## API login

- [x] T1 — Add the login API contract and the raw login call, with the positive API tests
  - Covers: RF-13 / TC-001-17, TC-001-18
  - Depends on: —
  - Files:
    - src/api/api-result.ts (`ApiResult`, `ApiRequestContext`)
    - src/api/schemas/auth-login.schema.ts (`authLoginSuccessSchema`, `apiMessageSchema`)
    - src/api/auth-messages.ts
    - src/api/auth-client.ts (`postLogin`, `loginSession`)
    - src/fixtures/test.ts (`accountB`)
    - tests/api/auth-login-api.spec.ts
  - Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-1[78]" --project=api` passes (2 tests), and `npx playwright test tests/api/auth-login.spec.ts --project=api` (Spec 000 sanity) still passes

- [x] T2 — Test API login rejection for unknown accounts and missing or empty fields
  - Covers: RF-14, RF-15, RF-16 / TC-001-20, TC-001-21, TC-001-22, TC-001-23
  - Depends on: T1
  - Files:
    - src/data/auth-data.ts (`UNKNOWN_EMAIL`, `TEST_PASSWORD`)
    - tests/api/auth-login-api.spec.ts
  - Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-2[0-3]" --project=api` passes (4 tests). The exact empty-field messages of TC-001-23 are verified and recorded.

- [x] T3 — Test API login with injection-style, over-long and non-exact emails
  - Covers: RF-17, RF-18, RF-19 / TC-001-24, TC-001-25, TC-001-26
  - Depends on: T2
  - Files:
    - src/data/auth-data.ts (`INJECTION_INPUTS`, `emailOfLength`, `valueOfLength`, `untrimmed`, `upperCased`)
    - tests/api/auth-login-api.spec.ts
  - Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-2[4-6]" --project=api` passes (3 tests)

- [x] T4 — Add the wrong-password helper and the single wrong-password API test
  - Covers: RF-14, RF-28 / TC-001-19
  - Depends on: T2
  - Files:
    - src/data/auth-data.ts (`withWrongPassword`)
    - tests/api/auth-login-api.spec.ts (own describe with `test.describe.configure({ retries: 0 })`)
  - Done when: `npx playwright test tests/api/auth-login-api.spec.ts --grep "TC-001-19" --project=api` passes (1 test, run once)

- [x] T5 — Enforce the wrong-password limit with a static check
  - Covers: RF-28 / TC-001-40, TC-001-41
  - Depends on: T4
  - Files:
    - scripts/check-wrong-password.ts (`findWrongPasswordViolations`)
    - tests/fixtures/wrong-password/ (two account A tests and one account B test)
    - tests/unit/security/wrong-password-limit.test.ts
  - Done when: `npx vitest run tests/unit/security/wrong-password-limit.test.ts -t "TC-001-4[01]"` passes (2 tests)

## API authorization

- [x] T6 — Add the user client and the protected-endpoint authorization tests
  - Covers: RF-24, RF-25, RF-26 / TC-001-33, TC-001-34, TC-001-35, TC-001-36
  - Depends on: T1
  - Files:
    - src/api/user-client.ts
    - src/data/auth-data.ts (`tamperToken`, `MALFORMED_AUTHORIZATION`)
    - src/fixtures/test.ts (`userClient`, `apiSession`)
    - tests/api/user-authorization.spec.ts
  - Done when: `npx playwright test tests/api/user-authorization.spec.ts --grep "TC-001-3[3-6]" --project=api` passes (4 tests). The messages of TC-001-36 are verified and recorded.

## Secret-safe tracing

- [x] T7 — Add `NO_TRACE` and the form-credential fixtures that require tracing off
  - Covers: RF-27 / TC-001-37, TC-001-38
  - Depends on: T1
  - Files:
    - src/fixtures/test.ts (`NO_TRACE`, `formAccountA`, `formAccountB` with the trace guard)
    - tests/fixtures/playwright/no-trace/ (config built with the real builder; a marked UI test and an unmarked UI test, each failing once with `page.setContent`)
    - tests/unit/reporting/no-trace.test.ts
  - Done when: `npx vitest run tests/unit/reporting/no-trace.test.ts -t "TC-001-3[78]"` passes (2 tests), and `npx vitest run tests/unit/reporting/tracing.test.ts` still passes

## UI login

- [x] T8 — Add NavBar, DashboardPage and the dashboard route, with the guest-session tests
  - Covers: RF-3, RF-12, RF-20, RF-23 / TC-001-05, TC-001-31
  - Depends on: —
  - Files:
    - src/config/urls.ts (`DASHBOARD_ROUTE`, `buildDashboardUrl`, route patterns)
    - src/components/nav-bar.ts
    - src/pages/dashboard-page.ts
    - src/fixtures/test.ts (`dashboardPage`)
    - tests/ui/auth-login-validation.spec.ts
  - Done when: `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-(05|31)" --project=chromium` passes (2 tests)

- [x] T9 — Extend LoginPage and test the form login with accounts A and B
  - Covers: RF-1, RF-2, RF-3, RF-27 / TC-001-01, TC-001-02, TC-001-03
  - Depends on: T7, T8
  - Files:
    - src/pages/login-page.ts (`fillCredentials`, `submit`, `login`, `loginWithKeyboard`)
    - tests/ui/auth-form-login.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/auth-form-login.spec.ts --grep "TC-001-0[1-3]" --project=chromium` passes (3 tests), and no `trace.zip` exists under `test-results/` for these tests

- [x] T10 — Test the client-side validation messages and the input masking
  - Covers: RF-4, RF-5, RF-6, RF-9, RF-10 / TC-001-06, TC-001-07, TC-001-08, TC-001-09, TC-001-12, TC-001-13
  - Depends on: T9
  - Files:
    - src/pages/login-page.constants.ts (`LOGIN_MESSAGES`)
    - src/pages/login-page.ts (message locators)
    - tests/ui/auth-login-validation.spec.ts
  - Done when: `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-(0[6-9]|1[23])" --project=chromium` passes (6 tests)

- [x] T11 — Test the wrong-credentials alert and injection-style input in the form
  - Covers: RF-7, RF-8, RF-9 / TC-001-10, TC-001-11
  - Depends on: T10
  - Files:
    - src/pages/login-page.ts (`incorrectCredentialsAlert`, `recordDialogs`)
    - tests/ui/auth-login-validation.spec.ts
  - Done when: `npx playwright test tests/ui/auth-login-validation.spec.ts --grep "TC-001-1[01]" --project=chromium` passes (2 tests). The alert role and accessible name are verified and recorded.

- [x] T12 — Test the login form against a failing or silent login API
  - Covers: RF-9, RF-11 / TC-001-14, TC-001-15
  - Depends on: T9
  - Files: tests/mocked/auth-login-api-failure.spec.ts
  - Done when: `npx playwright test tests/mocked/auth-login-api-failure.spec.ts --grep "TC-001-1[45]" --project=chromium` passes (2 tests)

## Session

- [x] T13 — Add the API-session fixture and test the session in the UI
  - Covers: RF-3, RF-12, RF-20 / TC-001-04, TC-001-16, TC-001-27
  - Depends on: T6, T7, T8
  - Files:
    - src/fixtures/test.ts (`loggedInTest` with `storageState`, `SESSION_STORAGE_KEY`, trace guard)
    - tests/ui/auth-session.spec.ts (`test.use(NO_TRACE)`)
  - Done when: `npx playwright test tests/ui/auth-session.spec.ts --grep "TC-001-(04|16|27)" --project=chromium` passes (3 tests). The storage key is verified and recorded.

- [x] T14 — Test Sign Out and browser history before and after it
  - Covers: RF-21, RF-22 / TC-001-28, TC-001-29, TC-001-30
  - Depends on: T13
  - Files:
    - src/components/nav-bar.ts (Cart control)
    - tests/ui/auth-session.spec.ts
  - Done when: `npx playwright test tests/ui/auth-session.spec.ts --grep "TC-001-(28|29|30)" --project=chromium` passes (3 tests). The second protected route is verified and recorded.

- [x] T15 — Test that removing the stored session sends the customer to login
  - Covers: RF-23 / TC-001-32
  - Depends on: T13
  - Files:
    - src/pages/dashboard-page.ts (`clearStoredSession`)
    - tests/ui/auth-session.spec.ts
  - Done when: `npx playwright test tests/ui/auth-session.spec.ts --grep "TC-001-32" --project=chromium` passes (1 test)

## Cross-browser, secrets and traceability

- [x] T16 — Run the suite on all browsers, scan the artifacts and update the traceability matrix
  - Covers: all RFs (Done criteria: UI TCs green on firefox and webkit; RF-27 scan)
  - Depends on: T1 to T15
  - Files:
    - README.md ("Test account recovery" note, spec edge case)
    - docs/traceability.md (regenerated)
    - specs/001-authentication/implementation.md
  - Done when:
    - `npx playwright test --grep "TC-001-" --project=api --project=chromium --project=firefox --project=webkit` passes;
    - `npm run check:secrets` exits 0 on its artifacts;
    - `npm run test:unit` passes;
    - `npm run spec:check -- --write` passes with no Spec 001 warning.

## Coverage check
| Test case (Automate: Y) | Task |
|-------------------------|------|
| TC-001-01 | T9 |
| TC-001-02 | T9 |
| TC-001-03 | T9 |
| TC-001-04 | T13 |
| TC-001-05 | T8 |
| TC-001-06 | T10 |
| TC-001-07 | T10 |
| TC-001-08 | T10 |
| TC-001-09 | T10 |
| TC-001-10 | T11 |
| TC-001-11 | T11 |
| TC-001-12 | T10 |
| TC-001-13 | T10 |
| TC-001-14 | T12 |
| TC-001-15 | T12 |
| TC-001-16 | T13 |
| TC-001-17 | T1 |
| TC-001-18 | T1 |
| TC-001-19 | T4 |
| TC-001-20 | T2 |
| TC-001-21 | T2 |
| TC-001-22 | T2 |
| TC-001-23 | T2 |
| TC-001-24 | T3 |
| TC-001-25 | T3 |
| TC-001-26 | T3 |
| TC-001-27 | T13 |
| TC-001-28 | T14 |
| TC-001-29 | T14 |
| TC-001-30 | T14 |
| TC-001-31 | T8 |
| TC-001-32 | T15 |
| TC-001-33 | T6 |
| TC-001-34 | T6 |
| TC-001-35 | T6 |
| TC-001-36 | T6 |
| TC-001-37 | T7 |
| TC-001-38 | T7 |
| TC-001-40 | T5 |
| TC-001-41 | T5 |

TC-001-39 is manual (Automate: N) and is recorded in validation.md.
