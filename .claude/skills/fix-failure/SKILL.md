---
name: fix-failure
description: Explains why the last local test run or a GitHub Actions run failed, fixes the cause test-first following the SDD rules, re-runs the failed tests and records the failure in docs/bug-log.md. Use when a manual test, a VS Code task or a pipeline run is red, or when the user asks why something failed.
---

# Fix Failure (Spec 000 RF-97)

## Input
- No argument: the latest local results (`reports/results.json`, `reports/unit-results.json`).
- A GitHub Actions run id (`/fix-failure <run-id>`): that run.
- A test title or TC ID: only that failure.

## Rules
- Follow AGENTS.md and `docs/constitution.md`. Changes in behavior start in the spec, never in the code.
- Tests first: every code fix comes with a regression test that fails before the fix (red) and
  passes after it (green).
- Always re-run the failed tests before recording a fix as passed.
- never commit or push: the user decides when to commit and push.
- never print secrets: `report:failures` already redacts them; never open or paste `.env`,
  GitHub secrets or raw trace data that may contain them.
- Conversation in Spanish; code, tests and docs in English.

## Steps
1. **Collect the evidence.** Run `npm run report:failures` (local) or
   `npm run report:failures -- --run <id>` (GitHub run). If it says there is no failure, answer
   "No failure found", show what was checked (files and their dates, or the run) and change nothing.
2. **Order.** With failures in both layers, handle the unit failures first, then the Playwright
   ones. Handle one failure at a time.
3. **Find the cause.** Read the failing test, the code it exercises, and the evidence named in the
   report (error line, trace with `npx playwright show-trace <trace>`, screenshot, log tail).
   Classify it and explain it to the user in plain words:
   - **Test bug** (wrong locator, wrong expectation, missing wait, bad data);
   - **Framework bug** (page object, API client, fixture, script, workflow);
   - **Environment or site outage** (demo site or API down or slow, test account changed, network);
   - **Real defect of the shop** (the site does not do what the spec says);
   - **Behavior change** (the spec itself no longer matches what is wanted).
4. **Fix.**
   - Test bug or framework bug: write or adjust the regression test first, see it red, fix the
     code, see it green.
   - Behavior change: do not change code; propose the spec change (Mode C) and STOP for approval.
   - Site outage: no code change; record it with `Passed ✅` empty and how to retry.
   - Real shop defect: no code change unless the spec says how to handle known defects; record it.
5. **Re-run the failed tests** on the projects shown in the report, e.g.
   `npx playwright test <file> --project=<project> -g "<TC ID>"` or
   `npx vitest run <file> -t "<TC ID>"`; when code changed, also run `npm run lint`,
   `npm run typecheck` and `npm run spec:check` (and `npm run test:unit -- tests/unit/ci` if CI
   files changed). Show the results. If it is still red, go back to step 3.
6. **Record it** in `docs/bug-log.md`: add or update one row per failure with
   `Bug / failure | Passed ✅ | Failed ❌ | How it is fixed | Solution` (Failed = where it failed,
   Passed = where it passed after the fix or empty, How = cause and approach, Solution = files changed
   and "not committed yet" until the user commits). If the failure belongs to a task, also update
   that spec's `execution-report.md`.
7. **Report and STOP**: the cause, the fix, the re-run result and the bug-log row; ask whether to
   commit and push.
