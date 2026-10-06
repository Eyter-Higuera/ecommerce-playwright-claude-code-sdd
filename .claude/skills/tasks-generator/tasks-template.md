# Tasks — Spec NNN <Feature name>

Status: draft
<!-- Allowed values: draft | approved -->
Spec: specs/NNN-<feature>/spec.md · Plan: specs/NNN-<feature>/plan.md

Rules: one task at a time, tests first, max 20-30 minutes per task, in dependency order.

- [ ] T1 — <Short imperative title>
  - Covers: RF-1 / TC-NNN-01, TC-NNN-02
  - Depends on: —
  - Files: <files to create or change>
  - Done when: <verifiable command and result, e.g. `npx playwright test tests/ui/login.spec.ts --grep "TC-NNN-01" --project=chromium` passes>

- [ ] T2 — <Short imperative title>
  - Covers: RF-2 / TC-NNN-03
  - Depends on: T1
  - Files: <files>
  - Done when: <verifiable command and result>

## Coverage check
| Test case (Automate: Y) | Task |
|-------------------------|------|
| TC-NNN-01 | T1 |
