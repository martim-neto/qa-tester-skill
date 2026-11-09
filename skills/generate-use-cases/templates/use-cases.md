# Use cases — <run-name>

- **Target URL:** <https://test-environment.example>
- **Generated on:** <YYYY-MM-DD>
- **Based on:** requirements.md, requirements-review.md
- **Test data variables:** <`$QA_PASSWORD` — password for the test accounts> <!-- secrets are never written in this file -->
- **Status:** <n> draft · <n> approved · <n> rejected

> How to review: edit any case below, or change its `Status` to `approved` or
> `rejected`. Keep the field names and the `## UC-xxx — Title` headings as they
> are — the test execution stage reads this format.

---

## UC-001 — <Short title, e.g. "Login with valid credentials">

- **Status:** draft
- **Requirements:** FR-01
- **Type:** Positive <!-- Positive | Negative | Edge -->
- **Priority:** High <!-- High | Medium | Low -->
- **Preconditions:** <starting state reachable from a fresh browser, e.g. "Logged in as standard_user, empty cart, on the products page" — never "after UC-xxx">
- **Test data:** <concrete values, e.g. "username: standard_user · password: $QA_PASSWORD">
- **Assumptions:** none <!-- or the assumption from requirements-review.md -->

**Steps**

1. <One user action>
2. <One user action>
3. <One user action>

**Expected result**

- <Observable outcome, e.g. "The products page is shown with the title 'Products'">
- <Additional checkpoint if needed>

---

## UC-002 — <Short title>

- **Status:** draft
- **Requirements:** FR-01
- **Type:** Negative
- **Priority:** High
- **Preconditions:** <…>
- **Test data:** <…>
- **Assumptions:** none

**Steps**

1. <…>

**Expected result**

- <…>

---

## Traceability matrix

| Requirement | Use cases | Notes |
|---|---|---|
| FR-01 | UC-001, UC-002 | |
| FR-02 | — | Not covered: needs clarification |

## Not covered

| Requirement | Reason |
|---|---|
| FR-0x | Needs clarification — see question 1 in requirements-review.md |

## Approval log

| Date | Change |
|---|---|
| <YYYY-MM-DD> | Generated <n> use cases (all draft) |
