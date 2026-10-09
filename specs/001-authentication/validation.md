# Validation — Spec 001 Authentication

Date: 2026-10-08 · Branch: eyter_dev · Commit: ce7e5e8
Spec: specs/001-authentication/spec.md

## Requirement coverage
Playwright results come from the TC-001 run on api, chromium, firefox and webkit (UI and mocked
tests run on all three browsers). Unit results come from `npm run test:unit`.

| RF | Test cases | Tests (file › title) | Result |
|----|------------|----------------------|--------|
| RF-1 | TC-001-01, TC-001-10 | tests/ui/auth-form-login.spec.ts › TC-001-01 login form with account A opens the dashboard · tests/ui/auth-login-validation.spec.ts › TC-001-10 unknown account shows the incorrect-credentials alert | PASS |
| RF-2 | TC-001-02, TC-001-03, TC-001-10 | tests/ui/auth-form-login.spec.ts › TC-001-02 …, TC-001-03 keyboard-only login with account B · auth-login-validation.spec.ts › TC-001-10 | PASS |
| RF-3 | TC-001-01, 02, 04, 05 | auth-form-login.spec.ts › TC-001-01, 02 · tests/ui/auth-session.spec.ts › TC-001-04 API-established session shows Sign Out on the dashboard · auth-login-validation.spec.ts › TC-001-05 login page without a session shows no Sign Out | PASS |
| RF-4 | TC-001-06, 07, 08 | auth-login-validation.spec.ts › TC-001-06 empty email …, TC-001-07 empty password …, TC-001-08 both fields empty … | PASS |
| RF-5 | TC-001-06, 07, 08 | auth-login-validation.spec.ts › TC-001-06, 07, 08 | PASS |
| RF-6 | TC-001-09, 10 | auth-login-validation.spec.ts › TC-001-09 invalid email formats show the valid-email message, TC-001-10 | PASS |
| RF-7 | TC-001-10, 01 | auth-login-validation.spec.ts › TC-001-10 · auth-form-login.spec.ts › TC-001-01 (no alert) | PASS |
| RF-8 | TC-001-11, 10 | auth-login-validation.spec.ts › TC-001-11 injection-style input opens no dialog and is rejected, TC-001-10 | PASS |
| RF-9 | TC-001-06 to 11, 14, 15, 01 | auth-login-validation.spec.ts › TC-001-06 to 11 · tests/mocked/auth-login-api-failure.spec.ts › TC-001-14, 15 · auth-form-login.spec.ts › TC-001-01 | PASS |
| RF-10 | TC-001-12, 13 | auth-login-validation.spec.ts › TC-001-12 password field masks typed characters, TC-001-13 email field shows typed characters | PASS |
| RF-11 | TC-001-14, 15, 01 | auth-login-api-failure.spec.ts › TC-001-14 login API server error …, TC-001-15 login API without an answer … | PASS |
| RF-12 | TC-001-16, 05 | auth-session.spec.ts › TC-001-16 login route opened while logged in redirects to the dashboard · auth-login-validation.spec.ts › TC-001-05 | PASS |
| RF-13 | TC-001-17, 18, 19, 20 | tests/api/auth-login-api.spec.ts › TC-001-17 API login with account A …, TC-001-18 …, TC-001-19 …, TC-001-20 … | PASS |
| RF-14 | TC-001-19, 20, 17 | auth-login-api.spec.ts › TC-001-19 API login with a wrong password for account A is rejected, TC-001-20 API login with an unknown account is rejected | PASS |
| RF-15 | TC-001-21, 23, 17 | auth-login-api.spec.ts › TC-001-21 API login without userPassword is rejected, TC-001-23 API login with empty-string fields is rejected | PASS |
| RF-16 | TC-001-22, 23, 17 | auth-login-api.spec.ts › TC-001-22 API login without userEmail is rejected, TC-001-23 | PASS |
| RF-17 | TC-001-24, 17 | auth-login-api.spec.ts › TC-001-24 API login with injection-style input returns 4xx and no token | PASS |
| RF-18 | TC-001-25, 20 | auth-login-api.spec.ts › TC-001-25 API login with over-long values returns 4xx and no token | PASS |
| RF-19 | TC-001-26, 17 | auth-login-api.spec.ts › TC-001-26 API login with an untrimmed or differently cased email is rejected | PASS |
| RF-20 | TC-001-27, 05 | auth-session.spec.ts › TC-001-27 reloading the dashboard keeps the session | PASS |
| RF-21 | TC-001-28, 27 | auth-session.spec.ts › TC-001-28 Sign Out navigates to the login page | PASS |
| RF-22 | TC-001-29, 30 | auth-session.spec.ts › TC-001-29 Back after Sign Out stays on the login page, TC-001-30 Back while logged in returns to the dashboard | PASS |
| RF-23 | TC-001-31, 32, 27 | auth-login-validation.spec.ts › TC-001-31 dashboard without a session redirects to the login page · auth-session.spec.ts › TC-001-32 removing the stored session sends the customer to login on reload | PASS |
| RF-24 | TC-001-33, 34, 35 | tests/api/user-authorization.spec.ts › TC-001-33 user endpoint answers 200 with the login token, TC-001-34, TC-001-35 | PASS |
| RF-25 | TC-001-34, 33, 36 | user-authorization.spec.ts › TC-001-34 user endpoint without Authorization answers 401, TC-001-36 | PASS |
| RF-26 | TC-001-35, 36, 33 | user-authorization.spec.ts › TC-001-35 user endpoint with a tampered token answers 401, TC-001-36 user endpoint with a malformed token answers 401 | PASS |
| RF-27 | TC-001-01, 02, 03, 37, 38, 39 | auth-form-login.spec.ts › TC-001-01 to 03 (`NO_TRACE`) · tests/unit/reporting/no-trace.test.ts › TC-001-37 tests typing a real password record no trace, even on retry, TC-001-38 other UI tests still record a trace on first retry · TC-001-39 manual | PASS (automated) · MANUAL PASS (TC-001-39) |
| RF-28 | TC-001-40, 41 | tests/unit/security/wrong-password-limit.test.ts › TC-001-40 at most one wrong-password test targets a real account, TC-001-41 a second wrong-password test for a real account is flagged | PASS |

All 28 RFs are covered. All 40 TCs marked `Automate: Y` have a test whose title starts with their
ID (spec:check: 0 warnings).

## Manual test cases (Automate: N)
| Test case | Reason | Result |
|-----------|--------|--------|
| TC-001-39 auth suite artifacts pass the secrets scan in the pipeline | Enforced by the CI check:secrets jobs (Spec 000 RF-58); observed on a pipeline that ran the auth suite | PASS (2026-10-08, commit ce7e5e8): `check-secrets-api` and `check-secrets-ui-chromium` (eyter_dev pipeline 2926407382), `check-secrets-release` after the full regression (release pipeline 2926427722), `check-secrets-main` and `check-secrets-production` all passed with "no sensitive value in 4 file(s)" |

## Quality gates
| Gate | Result | Notes |
|------|--------|-------|
| Playwright: `npx playwright test --grep "TC-001-"`, run as `--project=api --project=chromium`, `--project=firefox` and `--project=webkit` (`--workers=2`) | PASS | 36 + 22 + 22 = 80 passed · 0 failed · 0 skipped · 0 flaky. Split by project because one invocation with all four projects exhausted local memory (see Issues) |
| `npm run check:secrets` (after each run) | PASS | No password or token in reports/, playwright-report/, test-results/ |
| `npm run test:unit` | PASS | 26 files, 100 passed · 0 failed |
| `npm run lint` | PASS | 0 errors, 0 warnings |
| `npm run typecheck` | PASS | |
| `npm run spec:check` | PASS | 2 specs, 0 warnings; docs/traceability.md regenerated (258 rows, 0 missing) |
| CI pipelines for ce7e5e8 | PASS | eyter_dev 2926407382: 9/9 jobs · release 2926427722: 7/7, `release-regression` 90 passed (Spec 000 + Spec 001 on api, chromium, firefox, webkit), 0 flaky · main 2926467850: 7/7 · production 2926485573: 6/6. Automatic promotion merged each stage |
| Test review checklist | PASS | Applied per task (T1 to T16) to every changed test, page object, fixture and client; findings were fixed (TC-001-09 AAA structure, two `no-conditional-in-test` warnings in TC-001-11) |

## Done criteria
- [x] Every RF has approved test cases.
- [x] All automated TCs are green on chromium and in the `api` project, and the UI TCs are green on firefox and webkit.
- [x] test-reviewer PASS.
- [x] `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS.
- [x] The pipeline on `eyter_dev` is green (2926407382, 9/9 jobs; the chain continued green up to production).
- [x] User validation (confirmed by the user on 2026-10-08).

## Issues found
- **Local resource limits (environment, not a defect).** Running all four projects in one local
  invocation crashed workers and browsers ("worker process exited unexpectedly", "Page crashed").
  Every affected test passed when re-run. CI runs each gate in its own job.
- **Findings resolved during implementation, with user approval:**
  - Real passwords leaked into HTML report step titles (`Fill "<value>"`). Fixed with
    `enterSecret()` (plan D-9). TC-001-03 was updated (Mode C).
  - TC-000-20 (Spec 000) fixed the smoke inventory. It was updated (Mode C on Spec 000).
- **No app defects found.** Every observed behavior matches the spec. All `TODO: VERIFY` items
  were resolved live.
- No RF without coverage, no failing test, no `Automate: Y` TC without a test, and no open
  `[NEEDS CLARIFICATION]`.

## Verdict
The spec IS fulfilled and was confirmed as validated by the user on 2026-10-08. Locally: 80/80 Playwright tests on api,
chromium, firefox and webkit, and 100/100 unit tests; lint, typecheck, spec:check and
check:secrets all pass. In CI, commit ce7e5e8 went green through eyter_dev, release (full
regression, 90 passed), main and production, and every check:secrets job passed (TC-001-39). The
user validated it.
