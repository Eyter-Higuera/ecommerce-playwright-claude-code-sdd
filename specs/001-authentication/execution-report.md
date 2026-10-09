# Execution Report — Spec 001 Authentication

Spec: specs/001-authentication/spec.md · Tasks: specs/001-authentication/tasks.md ·
Log: specs/001-authentication/implementation.md

This report is updated each time a task is completed. A task row reflects the task's
`Done when:` command; a file row reflects the tests that exercise that file.

Legend: ✅ = passed · ❌ = failed

## Summary
| Tasks completed | Passed | Failed |
|-----------------|--------|--------|
| 16 / 16 | ✅ 16 | ❌ 0 |

## Results
| Task / File | Purpose | Passed | Failed |
|-------------|---------|:------:|:------:|
| **T1 — Add the login API contract and the raw login call, with the positive API tests** | Done when: TC-001-17/18 pass (2 tests) and TC-000-80 still passes | ✅ | |
| tests/api/auth-login-api.spec.ts | TC-001-17: account A login returns 200, token, userId and "Login Successfully" · TC-001-18: same for account B | ✅ | |
| src/api/auth-client.ts | `postLogin` (status + body, no throw), `loginSession` (token + userId); Spec 000 `login()` unchanged | ✅ | |
| src/api/api-result.ts, src/api/auth-messages.ts, src/api/schemas/auth-login.schema.ts | HTTP statuses, raw result, API messages, RF-13 contract | ✅ | |
| src/fixtures/test.ts | `accountB` fixture | ✅ | |
| **T2 — Test API login rejection for unknown accounts and missing or empty fields** | Done when: TC-001-20 to TC-001-23 pass (4 tests) | ✅ | |
| tests/api/auth-login-api.spec.ts | TC-001-20: unknown account → 400 "Incorrect email or password." · TC-001-21: no userPassword → 400 "Password is required" · TC-001-22: no userEmail → 400 "Email is required" · TC-001-23: empty fields → same messages; never a token | ✅ | |
| src/data/auth-data.ts | `UNKNOWN_EMAIL`, `TEST_PASSWORD` (TEST_ values, `.test` domain) | ✅ | |
| **T3 — Test API login with injection-style, over-long and non-exact emails** | Done when: TC-001-24 to TC-001-26 pass (3 tests) | ✅ | |
| tests/api/auth-login-api.spec.ts | TC-001-24: 3 injection values × 2 fields → 4xx, no token · TC-001-25: 255/256/1,000-character values → 4xx, no token · TC-001-26: untrimmed and upper-case email of account A → 400 "Incorrect email or password." | ✅ | |
| src/data/auth-data.ts | Injection list, length builders, email form helpers | ✅ | |
| **T4 — Add the wrong-password helper and the single wrong-password API test** | Done when: TC-001-19 passes (1 test, run once) | ✅ | |
| tests/api/auth-login-api.spec.ts | TC-001-19: account A with a wrong password → 400 "Incorrect email or password.", no token; retries 0 | ✅ | |
| src/data/auth-data.ts | `withWrongPassword()` (RF-28 entry point) | ✅ | |
| **T5 — Enforce the wrong-password limit with a static check** | Done when: TC-001-40 and TC-001-41 pass (2 tests) | ✅ | |
| tests/unit/security/wrong-password-limit.test.ts | TC-001-40: the repository has exactly one wrong-password use (TC-001-19, account A, tests/api/, retries 0) · TC-001-41: the fixture's three offending tests are named with their account and reasons | ✅ | |
| scripts/check-wrong-password.ts | Static RF-28 check over `*.spec.ts` files | ✅ | |
| tests/fixtures/wrong-password/ | Fixture breaking the limit (two account A tests, one account B test) | ✅ | |
| **T6 — Add the user client and the protected-endpoint authorization tests** | Done when: TC-001-33 to TC-001-36 pass (4 tests) | ✅ | |
| tests/api/user-authorization.spec.ts | TC-001-33: login token → 200 · TC-001-34: no header → 401 "Access denied. No token provided." · TC-001-35: tampered token → 401 "Session Timeout" · TC-001-36: non-token → 401 "Session Timeout", empty → 401 "Access denied. No token provided." | ✅ | |
| src/api/user-client.ts | Protected user endpoint client | ✅ | |
| src/fixtures/test.ts | `userClient`, `apiSession` | ✅ | |
| src/data/auth-data.ts, src/config/urls.ts | `tamperToken`, malformed headers, cart-count URL | ✅ | |
| **T7 — Add `NO_TRACE` and the form-credential fixtures that require tracing off** | Done when: TC-001-37/38 pass (2 tests) and TC-000-40/41 still pass | ✅ | |
| tests/unit/reporting/no-trace.test.ts | TC-001-37: a retried test marked `NO_TRACE` that types a password leaves no trace · TC-001-38: a retried unmarked UI test keeps its first-retry trace | ✅ | |
| src/fixtures/test.ts | `NO_TRACE`, `formAccountA` / `formAccountB` with the trace-off guard | ✅ | |
| tests/fixtures/playwright/no-trace/ | Fixture project (real builder and fixtures, `page.setContent` only) | ✅ | |
| **T8 — Add NavBar, DashboardPage and the dashboard route, with the guest-session tests** | Done when: TC-001-05 and TC-001-31 pass on chromium (2 tests) | ✅ | |
| tests/ui/auth-login-validation.spec.ts | TC-001-05: login page reloaded without a session shows no Sign Out · TC-001-31: dashboard without a session redirects to login | ✅ | |
| src/components/nav-bar.ts, src/pages/dashboard-page.ts | Sign Out control; dashboard navigation | ✅ | |
| src/config/urls.ts, src/fixtures/test.ts | Dashboard route and route patterns; `dashboardPage`, `navBar` fixtures | ✅ | |
| **T9 — Extend LoginPage and test the form login with accounts A and B** | Done when: TC-001-01 to TC-001-03 pass on chromium (3 tests) and leave no trace | ✅ | |
| tests/ui/auth-form-login.spec.ts | TC-001-01: account A → dashboard, Sign Out, no alert · TC-001-02: account B → dashboard · TC-001-03: keyboard login (Tab order email → password verified, Enter submits) | ✅ | |
| src/pages/login-page.ts | Login actions; `enterSecret()` keeps real passwords out of report step titles (D-9); `check:secrets` passed after the run | ✅ | |
| **T10 — Test the client-side validation messages and the input masking** | Done when: TC-001-06 to 09, 12, 13 pass on chromium (6 tests) | ✅ | |
| tests/ui/auth-login-validation.spec.ts | TC-001-06/07/08: required-field messages, alone and together · TC-001-09: 3 malformed emails → "*Enter Valid Email" · TC-001-12: password input type `password` · TC-001-13: email input shows its value | ✅ | |
| src/pages/login-page.ts, src/data/auth-data.ts | Validation message locators; `INVALID_EMAILS` | ✅ | |
| **T11 — Test the wrong-credentials alert and injection-style input in the form** | Done when: TC-001-10 and TC-001-11 pass on chromium (2 tests) | ✅ | |
| tests/ui/auth-login-validation.spec.ts | TC-001-10: unknown account → alert "Incorrect email or password.", no dialog, stays on login · TC-001-11: 3 injection values × 2 fields → rejected, no dialog | ✅ | |
| src/pages/login-page.ts | `recordDialogs()` | ✅ | |
| **T12 — Test the login form against a failing or silent login API** | Done when: TC-001-14 and TC-001-15 pass on chromium (2 tests) | ✅ | |
| tests/mocked/auth-login-api-failure.spec.ts | TC-001-14: mocked 500 and 503 → stays on login, no Sign Out · TC-001-15: aborted request → stays on login, no Sign Out | ✅ | |
| **T13 — Add the API-session fixture and test the session in the UI** | Done when: TC-001-04, TC-001-16, TC-001-27 pass on chromium (3 tests) | ✅ | |
| tests/ui/auth-session.spec.ts | TC-001-04: API session → dashboard with Sign Out · TC-001-16: login route while logged in → dashboard · TC-001-27: reload keeps the session | ✅ | |
| src/fixtures/test.ts | `loggedInTest` (`storageState` with the API token; trace-off guard) | ✅ | |
| **T14 — Test Sign Out and browser history before and after it** | Done when: TC-001-28 to TC-001-30 pass on chromium (3 tests) | ✅ | |
| tests/ui/auth-session.spec.ts | TC-001-28: Sign Out → login route · TC-001-29: Back after Sign Out stays on login · TC-001-30: Back from the cart while logged in → dashboard | ✅ | |
| src/components/nav-bar.ts, src/config/urls.ts | Sign Out and Cart actions; cart route | ✅ | |
| **T15 — Test that removing the stored session sends the customer to login** | Done when: TC-001-32 passes on chromium (1 test) | ✅ | |
| tests/ui/auth-session.spec.ts | TC-001-32: token removed + reload → login route, no Sign Out | ✅ | |
| src/pages/dashboard-page.ts | `clearStoredSession()`, `SESSION_STORAGE_KEY` | ✅ | |
| **T16 — Run the suite on all browsers, scan the artifacts and update the traceability matrix** | Done when: TC-001 suite green on api, chromium, firefox, webkit; check:secrets, test:unit, spec:check --write PASS | ✅ | |
| Playwright TC-001 suite | api + chromium 36 · firefox 22 · webkit 22 → 80 passed · 0 failed | ✅ | |
| `npm run check:secrets` | No sensitive value after each of the three runs | ✅ | |
| `npm run test:unit` | 100 passed · 0 failed (TC-000-20 updated, Mode C on Spec 000) | ✅ | |
| `npm run spec:check -- --write` | Passed; docs/traceability.md 258 rows, 0 missing | ✅ | |
| README.md | Account recovery, secrets in the browser, Windows grep patterns | ✅ | |
| **Validation (2026-10-08)** | Local re-run and pipelines for commit ce7e5e8 | ✅ | |
| Local Playwright TC-001 suite | api + chromium 36 · firefox 22 · webkit 22 → 80 passed; check:secrets PASS after each run | ✅ | |
| CI eyter_dev 2926407382 → release 2926427722 → main 2926467850 → production 2926485573 | All jobs green; release-regression 90 passed, 0 flaky; every check:secrets job passed (TC-001-39) | ✅ | |
