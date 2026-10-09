# Master Test Plan — E-commerce Test Automation

## 1. Objective
Verify the critical shopping workflows of the target e-commerce web application (a third-party
demo site) through automated unit, API, integration and UI tests, executed in a GitLab CI/CD
pipeline that gates promotion `eyter_dev → release → main → production`.

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
| `eyter_dev` | spec:check + lint + unit + API + smoke UI (chromium) |
| `release` | full regression on all browsers |
| `main` | smoke on all browsers → production deploy (publish validated framework + report) |

Manual runs: "Run pipeline" (web trigger) with CI/CD variables SUITE (smoke/regression) and BROWSER, on the selected branch.

## 7. Entry and exit criteria
- **Entry:** spec in `test-cases-approved` status; environment reachable; secrets configured.
- **Exit (per spec):** every RF covered by approved test cases; all automated TCs green;
  test-reviewer PASS; spec:check PASS; user validation.
- **Promotion:** smoke 100% pass; regression ≥ 98% pass with zero `@critical` failures;
  no new flaky tests (retries are reported and investigated).

## 8. Test data strategy
- All created data uses the `TEST_` prefix; factories generate unique values per run.
- Two fixed accounts (for authorization tests) + dynamically registered `TEST_` users.
- Credentials only via `.env` (local, gitignored) and masked, protected GitLab CI/CD variables (CI).
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
Playwright HTML report and JUnit XML, traces/screenshots/videos on failure, GitLab JUnit test report in the merge request/pipeline view,
artifacts retained in CI; traceability matrix in `docs/traceability.md`.
