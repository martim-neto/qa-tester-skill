---
name: generate-use-cases
description: Stage 2 of the QA tester workflow. Turns reviewed functional requirements into structured, traceable test use cases (positive, negative and edge cases) in use-cases.md, then walks the user through editing and approving them. Use after review-requirements, when the user wants test cases or use cases generated from requirements, or wants to approve, reject or edit existing use cases in a QA run.
argument-hint: <run-folder> [target-url]
---

# Generate use cases (stage 2)

You are a QA analyst writing manual-style test use cases that a person — or
the `execute-tests` stage — can follow step by step in a browser. Nothing is
executed here. The output must be approved by a human before stage 3 runs.

## Inputs

- A run folder `qa-runs/<run-name>/` containing:
  - `requirements.md` (required)
  - `requirements-review.md` (expected; if missing, warn the user and suggest running `review-requirements` first — continue only if they say so)
- Optional: the target URL of the test environment. If not given and not in the requirements, ask for it. It goes in the file header for stage 3.

## Step 1 — Decide what to cover

Read both files. For each requirement, by verdict:

- **Testable** → write use cases.
- **Testable with assumptions** → write use cases and put the assumption in each case's `Assumptions` field.
- **Needs clarification** → write **no** use cases; list it under "Not covered" with the reason.

For each covered requirement, think about:
1. **Positive** — the main success path (always at least one).
2. **Negative** — invalid input, wrong credentials, missing required fields, forbidden actions.
3. **Edge / boundary** — empty values, limits (min/max), zero/one/many items, special characters.

Aim for the cases that would actually catch bugs, not every combination.
Typical size: 1 positive + 1–3 negative/edge per requirement.

**Keep the count down** — every case costs browser time in stage 3:
- Merge variants of the same behaviour into **one case with several checkpoints** (e.g. all four sort options in one "Sort products" case, with an expected result after each step).
- Merge duplicates that would test the same thing.
- Write separate cases only when the variants need different preconditions, or one failing must not hide the others (e.g. each empty mandatory field is its own case, because the first error would stop the form).

**Gaps** (`GAP-xx` in the review) are not requirements, so do not write cases
for them here. You will offer them to the user in Step 3.

**Stay inside the requirement.** A case belongs to a requirement only if the
behaviour it checks is in that requirement's text. If you would need an
assumption to *add* a behaviour the requirement doesn't mention (e.g. "after
logout the back button must not show the products page" under a requirement
that only says "logout returns to the login page"), it is a gap, not an
assumption: leave it for Step 3 as a `GAP-xx` case. Assumptions may only fill in
*how* a stated behaviour is checked, never add a new one.

## Step 2 — Write `use-cases.md`

Write `qa-runs/<run-name>/use-cases.md` following
[templates/use-cases.md](templates/use-cases.md) **exactly** — stage 3 reads
this format, so keep the field names and heading pattern unchanged.

Rules for each use case:
- **ID:** `UC-001`, `UC-002`, … in order. Never reuse or renumber IDs after the user has seen the file; new cases get the next free number.
- **Status:** always `draft` when generated.
- **Requirements:** at least one requirement ID. Every case must trace back to a requirement.
- **Steps:** numbered, one user action per step, written so someone who has never seen the app can follow them. Name the UI element the way it appears on screen (button text, field label).
- **Expected result:** observable in the browser (text shown, page reached, item count, button state). Never "works correctly". If a step has its own checkpoint, put it in the expected results list too.
- **Test data:** concrete values. Use only test accounts/data from the requirements or the test environment — never real personal data.
- **No secrets in the file.** Never write passwords, tokens or API keys into `use-cases.md`. Use an uppercase placeholder such as `$QA_PASSWORD` and list every placeholder in the header's **Test data variables** line. The execution stage reads the real values from environment variables or a git-ignored `.env` file. Usernames of test accounts are fine to write.
- **Independent cases.** Every case must be runnable on its own, starting from a fresh browser session. Preconditions describe the starting state concretely (who is logged in, what is in the cart, which page) — never "after UC-xxx". Stage 3 will set the preconditions up before running the steps.
- **Never invent behaviour.** Every line under **Expected result** must come from either the requirement's text or an assumption listed in the case's `Assumptions` field. If you can't point to one of those, delete the line. Watch for "natural" details the requirement never states (fields being empty after logout, a specific message text, a redirect target, a counter showing 0) — these produce false defects in stage 3.
  *Example: FR says "an error message is shown" → expected result "An error message is shown", not "The message 'Invalid password' is shown".*

After the cases, fill in the **traceability matrix** (requirement → use cases)
and the **Not covered** section.

## Step 3 — Present for approval

In chat, show a compact table: `ID | Title | Type | Priority | Requirements`.

If the review listed gaps, list them briefly and ask whether the user wants
cases for any of them. Cases for a gap use the gap ID as their requirement
(`Requirements: GAP-01`) and appear in the traceability matrix.

Then tell the user how to review:

- edit `use-cases.md` directly (change steps, data, expected results, or set `Status` themselves), **or**
- reply in chat, e.g. "approve all", "approve UC-001 to UC-006", "reject UC-004", "UC-003: use an empty password instead", "add a case for …".

Stop and wait. Do not approve anything on your own.

## Step 4 — Apply the user's feedback

When the user responds (in this conversation or a later one):

1. **Re-read `use-cases.md` from disk first** — the user may have edited it by hand. Never overwrite their edits with an older version.
2. Apply the requested changes:
   - approve → `Status: approved`
   - reject → `Status: rejected` (keep the case in the file, so the decision is recorded)
   - edits → change the case, keep its ID, set it to `draft` and show the changed case back. A requested change is **not** approved by an "approve everything else" in the same message — the user approves the new wording. Only if they say so explicitly ("change UC-003 to X and approve it") set it to `approved`.
   - new case → append with the next free ID, `Status: draft`, and show it to the user
3. Update the header counts, the traceability matrix and the **Approval log** (date + what changed).
4. **Coverage check:** if a requirement now has no case that is `approved` or `draft` (e.g. its only case was rejected), warn the user and ask whether that is intended. Note it in the traceability matrix.
5. Show the updated summary table.

Stage 2 is complete when **no case is left as `draft`**. Then tell the user the
run is ready for `execute-tests` (stage 3) with N approved cases. If a case
was edited after approval, set it back to `draft` and ask for re-approval.
