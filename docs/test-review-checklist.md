# Test Review Checklist

Every changed test, page object, fixture or API client must pass this checklist before a task is
marked done. The `test-reviewer` skill applies it item by item; items marked **(ESLint)** are also
enforced automatically by the linter in CI.

Domain note: the original checklist targeted healthcare. For this e-commerce project,
"healthcare-critical paths" means **revenue- and security-critical paths** (checkout, payment,
authorization, account), and sensitive data means **real card numbers, real addresses, phones,
emails and dates of birth**.

## Imports
- [ ] Every local import path verified (Go to Definition resolves).
- [ ] Credentials imported from fixtures/env config, never hardcoded.
- [ ] Only `@playwright/test` (Playwright tests) or `vitest` (unit tests) imported in a file, never mixed. **(ESLint)**

## Structure
- [ ] `describe()` blocks group logically related tests, grouped by scenario type (positive, negative, boundary, security).
- [ ] Every test has a clear Arrange / Act / Assert boundary separated by blank lines.
- [ ] `beforeEach`/`afterEach` hooks don't over-share state between tests.
- [ ] Each test is independent and could run in any order without breaking.
- [ ] Test title starts with its test case ID, e.g. `TC-001-03 rejects login with wrong password`.

## Assertions
- [ ] Every assertion targets a meaningful behavior, not just "element exists".
- [ ] `toBe` vs `toEqual` used correctly (objects and arrays use `toEqual`).
- [ ] Error cases are tested, not just the happy path.
- [ ] Revenue/security-critical paths have explicit negative tests (unauthorized access, wrong data, invalid state).
- [ ] Web-first assertions used (`await expect(locator).toBeVisible()`), not manual polling. **(ESLint)**

## Selectors
- [ ] Locator priority respected: `getByRole` > `getByLabel` > `getByText` > `getByPlaceholder` > `getByTestId` > `locator(css)`.
- [ ] No CSS class selectors unless no alternative exists (justified with a comment). **(ESLint)**
- [ ] No text-content selectors that break on copy changes (text comes from constants, not inline literals).
- [ ] Locators live in Page Objects / components, not in test bodies.

## Async
- [ ] Every Playwright interaction has `await`. **(ESLint)**
- [ ] Every function containing `await` is marked `async`.
- [ ] No `waitForTimeout()`; waits target specific elements, URLs or responses (`waitForURL`, `waitForResponse`, auto-waiting assertions). **(ESLint)**

## Magic values
- [ ] No unexplained numbers (timeouts, counts, IDs); use named constants.
- [ ] No hardcoded strings that could change with UI copy updates.
- [ ] `// TODO: VERIFY` comments added wherever assumptions were made.

## Data
- [ ] All created test data uses the `TEST_` prefix or comes from fixtures/factories.
- [ ] No real-looking card numbers (only documented test cards), addresses, phones, emails or dates of birth.
- [ ] Cleanup happens after tests that create data (`afterEach` or `afterAll`).
- [ ] Unit tests make no real HTTP calls (dependencies mocked).

## Code style
- [ ] TypeScript strict; no `any` without a justifying comment.
- [ ] Page Object pattern used for UI; typed API clients used for API.
- [ ] Comments explain what each part checks and why (not what the code literally does).
- [ ] Everything written in English.
