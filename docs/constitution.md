# Constitution — ecommerce-playwright-sdd

1. **Simple stack**: TypeScript (strict) + Playwright Test + Vitest only. No new dependency without explicit approval.
2. **Spec first**: no test or framework code without an approved spec; every test title starts with a TC ID that maps to an RF. Only one active spec at a time, and a new spec is created only when the user requests it.
3. **Separation of concerns**: tests express intent (Arrange / Act / Assert); locators and actions live in Page Objects, HTTP details in API clients.
4. **Test quality**: locator priority getByRole > getByLabel > getByText > getByPlaceholder > getByTestId > css; no waitForTimeout; tests are independent; docs/test-review-checklist.md must PASS before a task is done.
5. **Data and secrets**: created data uses the TEST_ prefix and is cleaned up; credentials come only from env/fixtures; unit tests make no real HTTP calls.
6. **Language**: all code, comments, specs, docs, commit messages and test output are written in English.
