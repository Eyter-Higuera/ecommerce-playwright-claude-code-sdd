# Master Test Plan — E-commerce Test Automation

## 1. Objective
Verify the critical shopping workflows of the target e-commerce web application (a third-party
demo site) through automated unit, API, integration and UI tests, executed in a GitHub Actions
workflow that gates promotion `eyter_dev → release → main → production`.

## 2. Scope
**In scope:** authentication, catalog and search, product detail, cart, checkout, orders and
account, public/authenticated API endpoints, cross-layer integration, basic accessibility and
security checks, cross-browser execution.

**Out of scope:** load/performance testing, penetration testing, payment-provider internals,
the application's own source code (third-party site — not owned by this project).

## 3. Test levels (test pyramid)
| Level | Tool | Purpose | Network |
|---|---|---|---|
| Unit | Vitest | Framework code: helpers, data factories, price math, schemas, env loader, spec:check | None (mocked) |
| API | Playwright Test with Node `fetch` (`FetchRequestContext`) | Status codes, contracts (zod schemas), auth, invalid payloads | Real environment |
| Integration | Playwright (API + UI) | Cross-layer consistency: data created via API visible in UI and vice versa | Real environment |
| Mocked UI | Playwright `page.route()` | Error and edge states hard to reproduce (500, timeouts, payment decline) | Mocked responses |
| UI E2E | Playwright | Critical user journeys through the browser | Real environment |

## 4. Test design techniques
Equivalence partitioning, boundary value analysis, decision tables, state transition, error
guessing, pairwise (browsers/variants) and risk-based prioritization (P1 revenue/security
critical, P2 core, P3 minor).

## 5. Tags and suites
| Tag | Meaning |
|---|---|
| `@smoke` | P1 subset, fast, run on every push |
| `@regression` | Full functional suite |
| `@critical` | Revenue/security-critical; any failure blocks promotion |
| `@api`, `@ui`, `@integration`, `@mocked` | Test layer |

Suites are selected with `--grep`. Browsers: chromium, firefox, webkit, msedge, or all.

## 6. Environments and promotion
| Branch | Gate before promotion |
|---|---|
| `eyter_dev` | spec:check + lint + typecheck → unit → API smoke → UI smoke (chromium) |
| `release` | spec:check + lint + typecheck → unit → API regression → UI regression on chromium → firefox → webkit |
| `main` | spec:check + lint + typecheck → unit → API smoke → UI smoke on chromium → firefox → webkit |
| `production` | spec:check + lint + typecheck → unit → API smoke → UI smoke (chromium) (sanity after the last promotion; never promotes) |

Each arrow is a separate job that starts only after the previous one passed; a failure stops every
later job and the promotion (Spec 000 RF-83).

When every job of a push run on `eyter_dev`, `release` or `main` passes, the workflow's last job
merges the tested commit into the next branch (`.github/workflows/ci.yml`, Spec 000 RF-72 to RF-77).

Manual runs: "Run workflow" (workflow_dispatch) with the inputs SUITE (smoke/regression) and BROWSER, on the selected branch; they never promote.

## 7. Entry and exit criteria
- **Entry:** spec in `test-cases-approved` status; environment reachable; secrets configured.
- **Exit (per spec):** every RF covered by approved test cases; all automated TCs green;
  test-reviewer PASS; spec:check PASS; user validation.
- **Promotion:** smoke 100% pass; regression ≥ 98% pass with zero `@critical` failures;
  no new flaky tests (retries are reported and investigated).

## 8. Test data strategy
- All created data uses the `TEST_` prefix; factories generate unique values per run.
- Two fixed accounts (for authorization tests) + dynamically registered `TEST_` users.
- Credentials only via `.env` (local, gitignored) and GitHub encrypted secrets (CI).
- Data created by a test is cleaned up in `afterEach`/`afterAll`.

## 9. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Shared third-party demo environment changes or resets data | Create own data per test; assert on own data only |
| Rate limiting / slow network | Limited workers, retries in CI only, response-time budgets reported |
| Flaky tests | No hard waits, web-first assertions, traces on first retry |
| Data collisions between parallel workers | Unique `TEST_` data per worker |
| Site layout changes | Role/label-based locators, Page Objects isolate changes |

## 10. Reporting
Playwright HTML report and JUnit XML, traces/screenshots/videos on failure, JUnit `reports/junit.xml`
and the reports kept 7 days as GitHub Actions artifacts after a clean secrets scan; traceability matrix in `docs/traceability.md`.
Every CI test job adds a summary to the run's Summary page (passed, failed, skipped, flaky, total,
duration, failed titles); the unit job adds code coverage and the checks job the requirements
coverage per spec (Spec 000 RF-84 to RF-87). Each push run updates the GitHub Pages results page
with the latest results of every branch, linked from the README (RF-88, RF-89).
