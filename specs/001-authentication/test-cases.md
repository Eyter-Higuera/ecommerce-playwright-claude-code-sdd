# Test Cases — Spec 001 Authentication

Source spec: specs/001-authentication/spec.md · Ticket: N/A · Status: approved
<!-- Allowed values: draft | approved -->

## Summary
- 41 test cases for 28 RFs. Several TCs cover more than one RF when one scenario
  proves the positive case of one RF and the negative case of another.
- Layers: unit 4, api 14, mocked 2, ui 20, integration 1.
- Automated: 40; manual: 1.
- Smoke: 2 TCs (5%), all P1.
- Real accounts:
  - Only TC-001-01, TC-001-02, TC-001-03 type a real password into the browser (no trace, RF-27).
  - Every other UI test gets its session through the API.
  - The single wrong-password login for account A is TC-001-19, which runs once with retries 0 (RF-28).
  - Account B is used only for successful logins.

## Coverage matrix
| RF | Positive | Negative | Boundary | Security | Total |
|----|----------|----------|----------|----------|-------|
| RF-1 | TC-001-01 | TC-001-10 | — | — | 2 |
| RF-2 | TC-001-02, TC-001-03 | TC-001-10 | — | — | 3 |
| RF-3 | TC-001-01, TC-001-02, TC-001-04 | TC-001-05 | — | — | 4 |
| RF-4 | TC-001-06 | TC-001-07 | TC-001-08 | — | 3 |
| RF-5 | TC-001-07 | TC-001-06 | TC-001-08 | — | 3 |
| RF-6 | TC-001-09 | TC-001-10 | — | — | 2 |
| RF-7 | TC-001-10 | TC-001-01 | — | — | 2 |
| RF-8 | TC-001-11 | TC-001-10 | — | TC-001-11 | 2 |
| RF-9 | TC-001-06, TC-001-07, TC-001-08, TC-001-09, TC-001-10, TC-001-11, TC-001-14, TC-001-15 | TC-001-01 | — | — | 9 |
| RF-10 | TC-001-12 | TC-001-13 | — | TC-001-12 | 2 |
| RF-11 | TC-001-14, TC-001-15 | TC-001-01 | TC-001-14 | — | 3 |
| RF-12 | TC-001-16 | TC-001-05 | — | — | 2 |
| RF-13 | TC-001-17, TC-001-18 | TC-001-19, TC-001-20 | — | — | 4 |
| RF-14 | TC-001-19, TC-001-20 | TC-001-17 | — | TC-001-19 | 3 |
| RF-15 | TC-001-21, TC-001-23 | TC-001-17 | TC-001-23 | — | 3 |
| RF-16 | TC-001-22, TC-001-23 | TC-001-17 | TC-001-23 | — | 3 |
| RF-17 | TC-001-24 | TC-001-17 | — | TC-001-24 | 2 |
| RF-18 | TC-001-25 | TC-001-20 | TC-001-25 | — | 2 |
| RF-19 | TC-001-26 | TC-001-17 | TC-001-26 | — | 2 |
| RF-20 | TC-001-27 | TC-001-05 | — | — | 2 |
| RF-21 | TC-001-28 | TC-001-27 | — | TC-001-28 | 2 |
| RF-22 | TC-001-29 | TC-001-30 | — | TC-001-29 | 2 |
| RF-23 | TC-001-31, TC-001-32 | TC-001-27 | TC-001-32 | TC-001-31 | 3 |
| RF-24 | TC-001-33 | TC-001-34, TC-001-35 | — | — | 3 |
| RF-25 | TC-001-34 | TC-001-33 | TC-001-36 | TC-001-34 | 3 |
| RF-26 | TC-001-35, TC-001-36 | TC-001-33 | TC-001-36 | TC-001-35 | 3 |
| RF-27 | TC-001-01, TC-001-02, TC-001-03, TC-001-37, TC-001-39 | TC-001-38 | — | TC-001-37 | 6 |
| RF-28 | TC-001-40 | TC-001-41 | — | TC-001-40 | 2 |

## Test cases

### TC-001-01 — login form with account A opens the dashboard
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-3, RF-7, RF-9, RF-11, RF-27 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @smoke @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Logged out; on the login route |
| Test data       | TEST_USER_EMAIL / TEST_USER_PASSWORD from env (account A) |
| Steps           | **Given** the login page **When** account A email and password are submitted **Then** the customer is logged in |
| Expected result | URL contains `#/dashboard`; "Sign Out" button visible; no "Incorrect email or password." alert; no trace recorded for this test |
| Automate        | Y |

### TC-001-02 — login form with account B opens the dashboard
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2, RF-3, RF-27 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Logged out; on the login route |
| Test data       | TEST_USER_2_EMAIL / TEST_USER_2_PASSWORD from env (account B) |
| Steps           | **Given** the login page **When** account B email and password are submitted **Then** the customer is logged in |
| Expected result | URL contains `#/dashboard`; "Sign Out" button visible; no trace recorded for this test |
| Automate        | Y |

### TC-001-03 — keyboard-only login with account B
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-2, RF-27 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | Error guessing (accessibility) |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Logged out; on the login route |
| Test data       | Account B from env; only Tab, typing and Enter |
| Steps           | **Given** the login page and no mouse use **When** the fields are reached with Tab and the form is submitted with Enter **Then** the login works without a pointer |
| Expected result | URL contains `#/dashboard`; "Sign Out" button visible |
| Automate        | Y |

### TC-001-04 — API-established session shows Sign Out on the dashboard
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-3 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser) |
| Test data       | Account A token from `POST /auth/login` |
| Steps           | **Given** a session created through the API **When** the dashboard route is opened **Then** the session is recognised by the UI |
| Expected result | URL contains `#/dashboard`; "Sign Out" button visible |
| Automate        | Y |

### TC-001-05 — login page without a session shows no Sign Out
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-3, RF-12, RF-20 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | No session (fresh browser context) |
| Test data       | None |
| Steps           | **Given** a guest without a session **When** the login route is opened and reloaded **Then** no session appears |
| Expected result | URL still contains `#/auth/login` after the reload; no "Sign Out" button |
| Automate        | Y |

### TC-001-06 — empty email shows the email-required message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4, RF-5, RF-9 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | Email empty; password `TEST_pass_x` |
| Steps           | **Given** an empty email field **When** the form is submitted **Then** the login is rejected |
| Expected result | "*Email is required" visible; "*Password is required" not visible; URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-07 — empty password shows the password-required message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4, RF-5, RF-9 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | Email `TEST_nobody@example.test`; password empty |
| Steps           | **Given** an empty password field **When** the form is submitted **Then** the login is rejected |
| Expected result | "*Password is required" visible; "*Email is required" not visible; URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-08 — both fields empty show both required messages
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-4, RF-5, RF-9 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | Email and password empty |
| Steps           | **Given** both fields empty **When** the form is submitted **Then** both validations fire together |
| Expected result | "*Email is required" and "*Password is required" visible; URL contains `#/auth/login` |
| Automate        | Y |

### TC-001-09 — invalid email formats show the valid-email message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-6, RF-9 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | `TEST_not_an_email`, `TEST_@`, `@example.test` with password `TEST_pass_x` |
| Steps           | **Given** each malformed email **When** the form is submitted **Then** the email is rejected |
| Expected result | "*Enter Valid Email" visible for each value; URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-10 — unknown account shows the incorrect-credentials alert
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-1, RF-2, RF-6, RF-7, RF-8, RF-9 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | `TEST_nobody@example.test` / `TEST_pass_x` (no such account) |
| Steps           | **Given** a well-formed email of no registered account **When** the form is submitted **Then** the login is rejected |
| Expected result | Alert (role `alert`) "Incorrect email or password." visible within 30 s; no "*Enter Valid Email"; no browser dialog; URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-11 — injection-style input opens no dialog and is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-8, RF-9 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route; a dialog listener records any browser dialog |
| Test data       | `' OR '1'='1`, `<script>alert('TEST')</script>`, `"><img src=x onerror=alert('TEST')>` in the email field, then in the password field (email `TEST_nobody@example.test`) |
| Steps           | **Given** each injection-style value **When** the form is submitted **Then** nothing is executed |
| Expected result | No browser dialog opened for any value; URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-12 — password field masks typed characters
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10 |
| Priority        | P2 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | `TEST_pass_x` |
| Steps           | **Given** the password field **When** a value is typed **Then** the value is hidden |
| Expected result | Password input has type `password` |
| Automate        | Y |

### TC-001-13 — email field shows typed characters
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-10 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | EP |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route |
| Test data       | `TEST_nobody@example.test` |
| Steps           | **Given** the email field **When** a value is typed **Then** only the password is masked |
| Expected result | Email input is not of type `password`; its value equals the typed text |
| Automate        | Y |

### TC-001-14 — login API server error keeps the customer on the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9, RF-11 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | BVA |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route; `POST **/auth/login` mocked |
| Test data       | Mocked HTTP 500 and 503 (boundary of the 5xx partition) |
| Steps           | **Given** a login API that answers 5xx **When** the form is submitted with `TEST_nobody@example.test` / `TEST_pass_x` **Then** no session is created |
| Expected result | URL contains `#/auth/login`; no "Sign Out" for each status |
| Automate        | Y |

### TC-001-15 — login API without an answer keeps the customer on the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-9, RF-11 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | mocked |
| Tags            | @regression @mocked |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | On the login route; `POST **/auth/login` aborted |
| Test data       | Mocked network failure (request aborted) |
| Steps           | **Given** a login request that gets no answer **When** the form is submitted **Then** no session is created |
| Expected result | URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-16 — login route opened while logged in redirects to the dashboard
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-12 |
| Priority        | P3 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser) |
| Test data       | Account A token |
| Steps           | **Given** a logged-in customer **When** the login route is opened **Then** the login page is skipped |
| Expected result | URL contains `#/dashboard`; "Sign Out" visible |
| Automate        | Y |

### TC-001-17 — API login with account A returns token, userId and message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-14, RF-15, RF-16, RF-17, RF-19 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | Account A from env |
| Steps           | **Given** account A credentials **When** `POST /auth/login` is sent **Then** the login succeeds |
| Expected result | HTTP 200; non-empty string `token`; non-empty string `userId`; message "Login Successfully" |
| Automate        | Y |

### TC-001-18 — API login with account B returns token, userId and message
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | Account B from env |
| Steps           | **Given** account B credentials **When** `POST /auth/login` is sent **Then** the login succeeds |
| Expected result | HTTP 200; non-empty string `token`; non-empty string `userId`; message "Login Successfully" |
| Automate        | Y |

### TC-001-19 — API login with a wrong password for account A is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-14 |
| Priority        | P1 |
| Type            | Negative |
| Technique       | Decision table |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | The only wrong-password test for a real account (RF-28): runs once, retries 0 |
| Test data       | Account A email; password `TEST_wrong_pass` |
| Steps           | **Given** a registered email with a wrong password **When** `POST /auth/login` is sent **Then** the login is rejected |
| Expected result | HTTP 400; message "Incorrect email or password."; no `token` |
| Automate        | Y |

### TC-001-20 — API login with an unknown account is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-13, RF-14, RF-18 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | `TEST_nobody@example.test` / `TEST_pass_x` (no such account) |
| Steps           | **Given** an email of no registered account **When** `POST /auth/login` is sent **Then** the login is rejected |
| Expected result | HTTP 400; message "Incorrect email or password."; no `token` |
| Automate        | Y |

### TC-001-21 — API login without userPassword is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | Body `{ "userEmail": "TEST_nobody@example.test" }` |
| Steps           | **Given** a body without `userPassword` **When** `POST /auth/login` is sent **Then** the request is rejected |
| Expected result | HTTP 400; message "Password is required"; no `token` |
| Automate        | Y |

### TC-001-22 — API login without userEmail is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-16 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | Body `{ "userPassword": "TEST_pass_x" }` |
| Steps           | **Given** a body without `userEmail` **When** `POST /auth/login` is sent **Then** the request is rejected |
| Expected result | HTTP 400; message "Email is required"; no `token` |
| Automate        | Y |

### TC-001-23 — API login with empty-string fields is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-15, RF-16 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | `userEmail: ""` with `userPassword: "TEST_pass_x"`; `userEmail: "TEST_nobody@example.test"` with `userPassword: ""` |
| Steps           | **Given** each field present but empty **When** `POST /auth/login` is sent **Then** the request is rejected |
| Expected result | HTTP 400 and no `token` for each body (exact message: TODO: VERIFY — expected "Email is required" / "Password is required") |
| Automate        | Y |

### TC-001-24 — API login with injection-style input returns 4xx and no token
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-17 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | `' OR '1'='1`, `<script>alert('TEST')</script>`, `"><img src=x onerror=alert('TEST')>` in `userEmail` (password `TEST_pass_x`), then in `userPassword` (email `TEST_nobody@example.test`) |
| Steps           | **Given** each injection-style value **When** `POST /auth/login` is sent **Then** the request is rejected without a server error |
| Expected result | HTTP status 400–499 (never 5xx) and no `token` for every value |
| Automate        | Y |

### TC-001-25 — API login with over-long values returns 4xx and no token
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-18 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | BVA |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | `userEmail` of 256 and 1,000 characters (`TEST_` + filler + `@example.test`); `userPassword` of 256 characters; 255-character values as the lower boundary |
| Steps           | **Given** each long value **When** `POST /auth/login` is sent **Then** the request is rejected without a server error |
| Expected result | HTTP status 400–499 (never 5xx) and no `token` for every value, 255 included |
| Automate        | Y |

### TC-001-26 — API login with an untrimmed or differently cased email is rejected
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-19 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | None |
| Test data       | Account A email with two leading and trailing spaces; account A email in upper case; account A correct password |
| Steps           | **Given** account A email in a non-exact form with the correct password **When** `POST /auth/login` is sent **Then** the email is not normalised |
| Expected result | HTTP 400; message "Incorrect email or password."; no `token` for each form |
| Automate        | Y |

### TC-001-27 — reloading the dashboard keeps the session
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-20, RF-21, RF-23 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser) |
| Test data       | Account A token |
| Steps           | **Given** a logged-in customer on the dashboard **When** the page is reloaded **Then** the session survives |
| Expected result | URL contains `#/dashboard`; "Sign Out" visible; not redirected to the login route |
| Automate        | Y |

### TC-001-28 — Sign Out navigates to the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-21 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser) |
| Test data       | Account A token |
| Steps           | **Given** a logged-in customer on the dashboard **When** "Sign Out" is activated **Then** the session ends |
| Expected result | URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-29 — Back after Sign Out stays on the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-22 |
| Priority        | P1 |
| Type            | Security |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser); then signed out |
| Test data       | Account A token |
| Steps           | **Given** a customer who just signed out **When** the browser goes back one step **Then** the dashboard is not shown |
| Expected result | URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-30 — Back while logged in returns to the dashboard
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-22 |
| Priority        | P3 |
| Type            | Negative |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser) |
| Test data       | Account A token; dashboard route, then another protected route (TODO: VERIFY route, e.g. `#/dashboard/cart`) |
| Steps           | **Given** a logged-in customer who moved from the dashboard to another page **When** the browser goes back one step **Then** history works normally while the session lasts |
| Expected result | URL contains `#/dashboard`; "Sign Out" visible |
| Automate        | Y |

### TC-001-31 — dashboard without a session redirects to the login page
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-23 |
| Priority        | P1 |
| Type            | Security |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui @critical |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | No session (fresh browser context) |
| Test data       | Dashboard route opened directly |
| Steps           | **Given** a guest without a session **When** the dashboard route is opened **Then** access is refused |
| Expected result | URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-32 — removing the stored session sends the customer to login on reload
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-23 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | State transition |
| Layer           | ui |
| Tags            | @regression @ui |
| Browsers        | chromium, firefox, webkit (msedge on explicit local request) |
| Preconditions   | Session for account A established through the API (no password typed in the browser); on the dashboard |
| Test data       | The browser-stored token removed (TODO: VERIFY storage key, observed `token` in localStorage) |
| Steps           | **Given** a dashboard whose stored session was removed **When** the page is reloaded **Then** the missing session is detected |
| Expected result | URL contains `#/auth/login`; no "Sign Out" |
| Automate        | Y |

### TC-001-33 — user endpoint answers 200 with the login token
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-24, RF-25, RF-26 |
| Priority        | P1 |
| Type            | Positive |
| Technique       | EP |
| Layer           | api |
| Tags            | @smoke @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | Account A logged in through the API |
| Test data       | `userId` and token of account A; token sent as-is in `Authorization` |
| Steps           | **Given** a valid token **When** `GET /user/get-cart-count/{userId}` is sent **Then** access is granted |
| Expected result | HTTP 200 |
| Automate        | Y |

### TC-001-34 — user endpoint without Authorization answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-24, RF-25 |
| Priority        | P1 |
| Type            | Security |
| Technique       | EP |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | Account A `userId` known |
| Test data       | No `Authorization` header |
| Steps           | **Given** no token **When** `GET /user/get-cart-count/{userId}` is sent **Then** access is refused |
| Expected result | HTTP 401; message "Access denied. No token provided." |
| Automate        | Y |

### TC-001-35 — user endpoint with a tampered token answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-24, RF-26 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api @critical |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | Account A logged in through the API |
| Test data       | Valid token with its last 4 characters replaced by `AAAA` |
| Steps           | **Given** a tampered token **When** `GET /user/get-cart-count/{userId}` is sent **Then** access is refused |
| Expected result | HTTP 401; message "Session Timeout" |
| Automate        | Y |

### TC-001-36 — user endpoint with a malformed token answers 401
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-25, RF-26 |
| Priority        | P3 |
| Type            | Boundary |
| Technique       | Error guessing |
| Layer           | api |
| Tags            | @regression @api |
| Browsers        | n/a (browser-independent `api` project) |
| Preconditions   | Account A `userId` known |
| Test data       | `Authorization: TEST_not_a_token` and an empty `Authorization` header |
| Steps           | **Given** a header that is not a token **When** `GET /user/get-cart-count/{userId}` is sent **Then** access is refused |
| Expected result | HTTP 401 for each header (exact message: TODO: VERIFY) |
| Automate        | Y |

### TC-001-37 — tests typing a real password record no trace, even on retry
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-27 |
| Priority        | P1 |
| Type            | Security |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Fixture Playwright project using the real config and fixtures; CI mode (retries on) |
| Test data       | Fixture UI test marked as typing a real password that fails once then passes (page.setContent only, `TEST_` value) |
| Steps           | **Given** a password-typing UI test that is retried **When** the fixture run finishes **Then** no trace exists for it |
| Expected result | No `trace.zip` under the fixture `test-results/` for that test, first retry included |
| Automate        | Y |

### TC-001-38 — other UI tests still record a trace on first retry
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-27 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Same fixture project and mode as the previous TC |
| Test data       | Fixture UI test not marked as typing a password, failing once then passing |
| Steps           | **Given** a normal UI test that is retried **When** the fixture run finishes **Then** Spec 000 RF-49 still applies to it |
| Expected result | `trace.zip` present for its first retry |
| Automate        | Y |

### TC-001-39 — auth suite artifacts pass the secrets scan in the pipeline
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-27 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | EP |
| Layer           | integration |
| Tags            | n/a (manual check) |
| Browsers        | n/a (pipeline level) |
| Preconditions   | Auth regression suite run in an eyter_dev or manual pipeline |
| Test data       | Accounts A and B from GitLab variables |
| Steps           | **Given** the auth tests have finished **When** the `check:secrets` job scans their artifacts **Then** no password or token is found |
| Expected result | check:secrets job passes |
| Automate        | N — enforced by the check:secrets CI job (Spec 000 RF-58); observed and recorded at validation |

### TC-001-40 — at most one wrong-password test targets a real account
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-28 |
| Priority        | P2 |
| Type            | Positive |
| Technique       | Decision table |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Repository test files |
| Test data       | All Playwright test files of the repository |
| Steps           | **Given** the repository test inventory **When** the wrong-password check inspects it **Then** the limit holds |
| Expected result | Exactly one test sends a wrong password for account A; it runs only in the `api` project with retries 0; none targets account B |
| Automate        | Y |

### TC-001-41 — a second wrong-password test for a real account is flagged
| Field           | Value |
|-----------------|-------|
| Requirement     | RF-28 |
| Priority        | P2 |
| Type            | Negative |
| Technique       | Error guessing |
| Layer           | unit |
| Tags            | n/a (Vitest unit test; tags apply to Playwright tests only) |
| Browsers        | n/a (no browser) |
| Preconditions   | Fixture test files |
| Test data       | Fixture with two wrong-password tests for account A and one for account B |
| Steps           | **Given** an inventory breaking the limit **When** the wrong-password check inspects it **Then** the violation is reported |
| Expected result | Check fails naming each offending test and account |
| Automate        | Y |

## Out of scope for testing
- Registration, password recovery, isolation between accounts A and B, real session expiry,
  "remember me", lockout policy, double submit, multi-tab Sign Out, and rate limiting (spec
  Out of scope).
- Known issues of the shop, which are not requirements:
  - The login form labels are not linked to their inputs.
  - Tokens stay valid after Sign Out.
  Neither has a test case.
- Load, performance and penetration testing (docs/test-plan.md §2).

## Notes for the plan
- RF-27: decide how a test declares that it types a real password (annotation, tag or fixture),
  so tracing is turned off for it alone. The fixture-run TCs prove both sides.
- RF-28: a static check over the test files enforces the wrong-password limit (one test, `api`
  project only, retries 0).
- Sessions through the API: the shop stores the token in browser storage (observed key
  `token`); TODO: VERIFY whether storing it is enough for every UI route.
- TODO: VERIFY the exact messages for empty-string fields and malformed tokens, and a second
  protected route for the Back-while-logged-in case.
- Smoke additions: the UI login with account A and the authorized user-endpoint call. The Spec 000
  sanity tests stay as they are.

## Open questions
None.
