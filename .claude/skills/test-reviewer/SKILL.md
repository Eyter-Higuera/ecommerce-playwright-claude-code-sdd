---
name: test-reviewer
description: Reviews changed test files, page objects, fixtures and API clients against docs/test-review-checklist.md item by item and produces a PASS/FAIL report. Use after implementing any task, before ticking it, or when the user asks to review tests.
---

# Test Reviewer

## Scope
- Default: files changed in the current task (`git diff --name-only` + untracked files) under
  `tests/`, `src/` and `scripts/`.
- If the user names files or a task, review those.

## Steps
1. Read `docs/test-review-checklist.md` (the source of truth; do not use a memorized copy).
2. Read every file in scope completely.
3. Evaluate EVERY checklist item for the files in scope. For each item decide:
   - **PASS** — satisfied in all files.
   - **FAIL** — violated; give `file:line` and the concrete fix.
   - **N/A** — does not apply (e.g. "cleanup" when no data is created); say why.
4. Pay special attention to:
   - Locators in test bodies instead of Page Objects; CSS class selectors; inline UI copy strings.
   - Missing `await`, `waitForTimeout`, hard-coded timeouts or IDs.
   - Assertions that only check existence instead of behavior.
   - Missing negative tests on revenue/security-critical paths (checkout, payment, authorization, account).
   - Hardcoded credentials, real-looking card numbers, emails, phones, addresses or dates of birth.
   - Created data without `TEST_` prefix or without cleanup.
   - Real HTTP calls in unit tests.
   - Test titles without a TC ID, or a TC ID that does not exist in test-cases.md.
   - Any non-English text.
5. If `npm run lint` is available, run it and include the result.

## Output format
```
| Section    | Item                                   | Result | Location        | Fix |
|------------|----------------------------------------|--------|-----------------|-----|
| Selectors  | No CSS class selectors                 | FAIL   | src/pages/x.ts:12 | Use getByRole('button', { name: ... }) |
| Async      | No waitForTimeout                      | PASS   | —               | —   |

Verdict: PASS | FAIL (<n> items failed)
```

Any FAIL means the task cannot be marked done. Read only: do not edit files unless the user (or
the implementation-generator flow) asks you to apply the fixes.
