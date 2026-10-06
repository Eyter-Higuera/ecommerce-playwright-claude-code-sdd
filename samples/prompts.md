# SDD prompts — one per phase

Flow: Constitution → Spec → Clarification → Test cases → Plan → Tasks → Implementation (one task at a time, tests first) → Validation → Change (spec first, then code).

| Phase | Skill | Essential prompt |
|---|---|---|
| 1. Constitution | — | "Propose a docs/constitution.md with 6 short, verifiable, non-negotiable principles covering: stack simplicity, spec-to-test relationship, separation of test intent and page/API details, test quality policy, test data and secrets, and language. Max 15 lines. Wait for my approval." |
| 2a. Spec (pasted story) | `/spec-generator` | "/spec-generator Create a spec from this user story: <paste user story + acceptance criteria>" |
| 2b. Spec (interview) | `/spec-generator` | "/spec-generator Create a new spec for <feature>. Interview me first." |
| 3. Clarification | `/spec-reviewer` | "/spec-reviewer Review specs/NNN-<feature>/spec.md as a senior QA. List: (1) ambiguities, (2) contradictions, (3) uncovered edge cases, (4) conflicts with docs/constitution.md. Do not propose solutions yet." |
| 4. Test cases | `/spec-generator` | "/spec-generator Create the recommended test cases for spec NNN." |
| 5. Plan | `/plan-generator` | "/plan-generator Create the plan for spec NNN." (DO NOT write code: page objects and API clients, fixtures, test data, mocking and locator strategy, technical decisions with the discarded alternative, and which RF/TC each part covers.) |
| 6. Tasks | `/tasks-generator` | "/tasks-generator Create the tasks for spec NNN." (Small tasks of 20-30 min max, in dependency order, each with the RF/TC it covers and a verifiable 'Done when:' line. Checkboxes.) |
| 7. Implementation | `/implementation-generator` | "/implementation-generator Implement ONLY task T2 of spec NNN. Then STOP." |
| 8. Review | `/test-reviewer` | "/test-reviewer Review the files changed in task T2 against docs/test-review-checklist.md." |
| 9. Validation | `/validation-generator` | "/validation-generator Validate spec NNN requirement by requirement and give me a verdict." (Writes specs/NNN-<feature>/validation.md.) |
| 10. Change | `/spec-generator` | "New requirement for spec NNN: <change>. DO NOT touch code. First update spec.md (new RF in EARS + edge cases) and test-cases.md, and show me the diff." |
