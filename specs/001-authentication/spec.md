# Spec 001 — Authentication

Status: implemented
<!-- Allowed values: draft | approved | test-cases-approved | implemented | validated -->
Source: interview

## Context and goal
Every later business flow of the demo shop (catalog, cart, checkout, orders) needs a reliable
login, and a broken login or session blocks all of them. This spec defines the observable
authentication behavior of https://rahulshettyacademy.com/client and its REST API:
- logging in through the UI and the API;
- rejecting invalid input and credentials;
- keeping and ending a session;
- authorizing API calls with the issued token.

It also defines how tests protect the real passwords, which Spec 000 left to this spec. Expected
results marked "observed" were seen on the live site on 2026-10-08.

## Users / actors
- Registered customer (test accounts A and B, from TEST_USER_* variables).
- Guest (no session).
- API consumer (calls the REST API with or without a token).

## User stories
- US-1: As a registered customer I want to log in with my email and password so that I can use the shop.
- US-2: As a registered customer I want to log out so that nobody else can use my session.
- US-3: As the shop owner I want protected pages and API endpoints to reject requests without a valid session so that customer data stays private.

## Requirements summary
Overview of the functional requirements below, grouped by block. It is a navigation aid only; the
EARS requirements are the source of truth.

| Block | Requirements | Content | Test cases |
|---|---|---|---|
| UI login | RF-1 to RF-12 | Dashboard with account A and B; "Sign Out" while logged in; empty fields; invalid email format; wrong-credentials alert; injection-style input; rejected login stays on the login page; masked password; API failure during login; login page while logged in | TC-001-01 login form with account A opens the dashboard<br>TC-001-02 login form with account B opens the dashboard<br>TC-001-03 keyboard-only login with account B<br>TC-001-04 API-established session shows Sign Out on the dashboard<br>TC-001-05 login page without a session shows no Sign Out<br>TC-001-06 empty email shows the email-required message<br>TC-001-07 empty password shows the password-required message<br>TC-001-08 both fields empty show both required messages<br>TC-001-09 invalid email formats show the valid-email message<br>TC-001-10 unknown account shows the incorrect-credentials alert<br>TC-001-11 injection-style input opens no dialog and is rejected<br>TC-001-12 password field masks typed characters<br>TC-001-13 email field shows typed characters<br>TC-001-14 login API server error keeps the customer on the login page<br>TC-001-15 login API without an answer keeps the customer on the login page<br>TC-001-16 login route opened while logged in redirects to the dashboard |
| API login | RF-13 to RF-19 | 200 with `token`, `userId`, "Login Successfully"; 400 for wrong credentials, missing password, missing email, injection-style input, over-long values, untrimmed or differently cased email | TC-001-17 API login with account A returns token, userId and message<br>TC-001-18 API login with account B returns token, userId and message<br>TC-001-19 API login with a wrong password for account A is rejected<br>TC-001-20 API login with an unknown account is rejected<br>TC-001-21 API login without userPassword is rejected<br>TC-001-22 API login without userEmail is rejected<br>TC-001-23 API login with empty-string fields is rejected<br>TC-001-24 API login with injection-style input returns 4xx and no token<br>TC-001-25 API login with over-long values returns 4xx and no token<br>TC-001-26 API login with an untrimmed or differently cased email is rejected |
| Session | RF-20 to RF-23 | Reload keeps the session; Sign Out goes to login; Back after Sign Out stays on login; dashboard without a session redirects to login | TC-001-05 login page without a session shows no Sign Out<br>TC-001-27 reloading the dashboard keeps the session<br>TC-001-28 Sign Out navigates to the login page<br>TC-001-29 Back after Sign Out stays on the login page<br>TC-001-30 Back while logged in returns to the dashboard<br>TC-001-31 dashboard without a session redirects to the login page<br>TC-001-32 removing the stored session sends the customer to login on reload |
| API authorization | RF-24 to RF-26 | User endpoint: 200 with token, 401 without token, 401 "Session Timeout" with a tampered token | TC-001-33 user endpoint answers 200 with the login token<br>TC-001-34 user endpoint without Authorization answers 401<br>TC-001-35 user endpoint with a tampered token answers 401<br>TC-001-36 user endpoint with a malformed token answers 401 |
| Test-framework constraints | RF-27 to RF-28 | No real password or auth token in any trace, report or attachment; at most one wrong-password login for a real account per run | TC-001-01 login form with account A opens the dashboard<br>TC-001-02 login form with account B opens the dashboard<br>TC-001-03 keyboard-only login with account B<br>TC-001-37 tests typing a real password record no trace, even on retry<br>TC-001-38 other UI tests still record a trace on first retry<br>TC-001-39 auth suite artifacts pass the secrets scan in the pipeline (manual)<br>TC-001-40 at most one wrong-password test targets a real account<br>TC-001-41 a second wrong-password test for a real account is flagged |

## Functional requirements (acceptance criteria in EARS)

Shared definitions:
- *Login route*: a URL containing `#/auth/login`.
- *Dashboard route*: a URL containing `#/dashboard`.
- *"Sign Out" control*: a visible button whose accessible name is "Sign Out".
- *Injection-style input* is this closed list: `' OR '1'='1`, `<script>alert('TEST')</script>` and
  `"><img src=x onerror=alert('TEST')>`.

### UI login
- RF-1: WHEN the login form is submitted with the email and password of test account A, THE SYSTEM SHALL navigate to the dashboard route. Source: interview Q1, Q2
- RF-2: WHEN the login form is submitted with the email and password of test account B, THE SYSTEM SHALL navigate to the dashboard route. Source: interview Q6
- RF-3: WHILE a customer is logged in, whether the session came from the login form or from an API login, THE SYSTEM SHALL show the "Sign Out" control. Source: interview Q2; review A-3
- RF-4: IF the login form is submitted with an empty email, THEN THE SYSTEM SHALL show "*Email is required". Source: interview (observed)
- RF-5: IF the login form is submitted with an empty password, THEN THE SYSTEM SHALL show "*Password is required". Source: interview (observed)
- RF-6: IF the login form is submitted with an email that is not in a valid email format, THEN THE SYSTEM SHALL show "*Enter Valid Email". Source: interview (observed)
- RF-7: IF the login form is submitted with credentials that do not match a registered account, THEN THE SYSTEM SHALL show an alert (role `alert`) with the text "Incorrect email or password." within 30 s. Source: interview Q5 (observed: toast notification)
- RF-8: IF the email or password field of the login form contains injection-style input, THEN THE SYSTEM SHALL open no browser dialog. Source: interview Q5; review 1.5
- RF-9: IF a login through the form is rejected (RF-4 to RF-8), THEN THE SYSTEM SHALL remain on the login route without showing the "Sign Out" control. Source: interview; review C-3
- RF-10: THE SYSTEM SHALL mask the characters typed in the password field. Source: review 3.9 (observed: input type `password`)
- RF-11: IF the login request of the form gets an HTTP 5xx answer or no answer, THEN THE SYSTEM SHALL remain on the login route without showing the "Sign Out" control. Source: review 3.10
- RF-12: WHEN the login route is opened while a customer is logged in, THE SYSTEM SHALL redirect to the dashboard route. Source: review 3.5 (observed)

### API login
- RF-13: WHEN `POST {API_BASE_URL}/auth/login` is sent with the credentials of test account A or B, THE SYSTEM SHALL answer HTTP 200 with a JSON body containing a non-empty string `token`, a non-empty string `userId` and the message "Login Successfully". Source: interview Q1, Q6 (observed)
- RF-14: IF `POST {API_BASE_URL}/auth/login` is sent with credentials that do not match a registered account (unknown email, or wrong password for a registered email), THEN THE SYSTEM SHALL answer HTTP 400 with the message "Incorrect email or password." and no `token`. Source: interview Q5 (observed)
- RF-15: IF `POST {API_BASE_URL}/auth/login` is sent without `userPassword`, THEN THE SYSTEM SHALL answer HTTP 400 with the message "Password is required" and no `token`. Source: interview (observed)
- RF-16: IF `POST {API_BASE_URL}/auth/login` is sent without `userEmail`, THEN THE SYSTEM SHALL answer HTTP 400 with the message "Email is required" and no `token`. Source: review E (observed)
- RF-17: IF `POST {API_BASE_URL}/auth/login` is sent with injection-style input in `userEmail` or `userPassword`, THEN THE SYSTEM SHALL answer with an HTTP 4xx status and no `token`. Source: interview Q5; review 1.6
- RF-18: IF `POST {API_BASE_URL}/auth/login` is sent with a `userEmail` or `userPassword` longer than 255 characters, THEN THE SYSTEM SHALL answer with an HTTP 4xx status and no `token`. Source: review 3.3 (observed: 400 "Incorrect email or password.")
- RF-19: IF `POST {API_BASE_URL}/auth/login` is sent with the email of a registered account with surrounding spaces or in a different letter case, together with its correct password, THEN THE SYSTEM SHALL answer HTTP 400 with the message "Incorrect email or password.". Source: review 3.1, 3.2 (observed: emails are neither trimmed nor case-insensitive)

### Session
- RF-20: WHILE a customer is logged in, WHEN the dashboard page is reloaded, THE SYSTEM SHALL stay on the dashboard route. Source: interview Q4
- RF-21: WHEN a logged-in customer activates the "Sign Out" control, THE SYSTEM SHALL navigate to the login route. Source: interview Q1
- RF-22: IF, after signing out, the customer goes back one step in the browser history, THEN THE SYSTEM SHALL show the login route without the "Sign Out" control. Source: interview Q4; review 1.7 (observed)
- RF-23: IF the dashboard route is opened without a session, THEN THE SYSTEM SHALL redirect to the login route. Source: interview Q4 (observed)

### API authorization
Protected user endpoint: `GET {API_BASE_URL}/user/get-cart-count/{userId}`. The `Authorization`
header carries the token exactly as returned by the login, with no `Bearer` prefix (observed).
- RF-24: WHEN the protected user endpoint is called with the `userId` and token returned by a successful login, THE SYSTEM SHALL answer HTTP 200. Source: interview Q4; review C-4 (observed)
- RF-25: IF the protected user endpoint is called without an `Authorization` header, THEN THE SYSTEM SHALL answer HTTP 401 with the message "Access denied. No token provided.". Source: interview Q4 (observed)
- RF-26: IF the protected user endpoint is called with a tampered token (a valid token whose last 4 characters are replaced), THEN THE SYSTEM SHALL answer HTTP 401 with the message "Session Timeout". Source: interview Q4; review 1.9 (observed)

### Test-framework constraints
- RF-27: WHEN an authentication test run finishes, THE SYSTEM SHALL leave no TEST_USER_* password or auth token in its traces, reports or attachments, as verified by `npm run check:secrets`. Tests that type a real password or hold an auth token in the browser therefore record no trace, retries included. This is an explicit exception to Spec 000 RF-49 for those tests. Source: interview Q3; review A-2, C-2; plan D-3
- RF-28: THE SYSTEM SHALL send at most one login with a wrong password for test account A per Playwright invocation, retries included, and none for test account B. Source: interview Q5, Q6; review A-1

## Non-functional requirements
- Accounts: only the two fixed accounts A and B (TEST_USER_* variables). No data is created on the shop, so no cleanup is needed.
- Browsers: UI requirements run on chromium, firefox and webkit (regression); the smoke subset runs on chromium.
- Real accounts and browsers:
  - The wrong-password case for a registered email (RF-14) is exercised only through the API, once (see RF-28).
  - In the UI, wrong credentials (RF-7) use unknown `TEST_` emails on every browser.
- Time budgets: the 30 s navigation and API budgets of Spec 000 apply.
- Stability:
  - Assertions target stable states (route, visible controls, HTTP status and body).
  - Transient notifications are asserted only where an RF names their text (RF-7), within the 30 s budget.
- Language: everything in English.

## Edge cases
- Email with surrounding spaces or in a different letter case: rejected (RF-19).
- Very long email or password: rejected with 4xx (RF-18).
- Shop API failing or not answering during a UI login (RF-11, with mocked responses).
- Session established through the API reused across a page reload (RF-3 with RF-20).
- Account A locked or its password changed by a third party: the positive login tests (RF-1, RF-13) fail. Recovery is documented in the README.
- Shop or API down or slow during the sanity tests: Spec 000 RF-53 and RF-57 apply.
- Browser differences: none known. RF-20 to RF-22 are checked on chromium, firefox and webkit.

## Known issues (observed, not requirements of this spec)
- Accessibility: the visible "Email" and "Password" labels of the login form are not linked to their inputs. The accessible names come from the placeholders, and the password placeholder has the typo "passsword" (observed in Spec 000, T15).
- Security: an API token stays valid after the customer signs out in the UI. The protected endpoint still answered 200 with it (observed). The shop does not invalidate tokens server-side on Sign Out.

## Out of scope
- User registration and password recovery ("Forgot password?").
- Isolation between accounts A and B (planned for the orders spec).
- Real session expiry over time, and "remember me" behavior.
- Account lockout policy of the shop itself.
- Double submit of the login form.
- Sign Out in one tab while another tab has the session open.
- Rate limiting (HTTP 429). CI uses few workers, and RF-28 keeps failed logins minimal.
- Changes to Spec 000 framework behavior beyond RF-27 and RF-28.

## Done criteria
- Every RF has approved test cases.
- All automated TCs are green on chromium and in the `api` project, and the UI TCs are green on firefox and webkit.
- test-reviewer PASS.
- `npm run lint`, `npm run typecheck`, `npm run spec:check` and `npm run check:secrets` PASS.
- The pipeline on `eyter_dev` is green.
- User validation.

## Open questions
None.

## Resolved clarifications
1. Scope: UI and API login, logout and session (interview Q1).
2. Successful UI login is checked by the dashboard route and the "Sign Out" control, not the transient toast (interview Q2).
3. Tests that type a real password record no trace. Sessions not under test come from the API (interview Q3; the "how" belongs in the plan).
4. Session and authorization: protected route without a session, reload, valid, missing and tampered tokens (interview Q4).
5. A wrong password on a real account is allowed in a limited way. Other negative cases use unknown `TEST_` emails (interview Q5).
6. Account B is used for successful logins only (interview Q6).
7. Spec review 1 (senior QA, 2026-10-08): 39 findings, all resolved with proposals A-1 to A-4, B, C-1 to C-4, D and E, approved by the user. A live probe resolved the RF-11 and whitespace questions. The protected endpoint changed from `product/get-all-products` to the user-scoped `user/get-cart-count/{userId}`.
8. Plan review (2026-10-08, Mode C approved by the user with plan decision D-3): the shop sends the auth token in its API calls, so a trace of a logged-in UI test would contain it and fail `check:secrets` (Spec 000 RF-23). RF-27 now also covers tests that hold an auth token in the browser.
