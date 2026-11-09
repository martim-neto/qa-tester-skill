---
name: write-report
description: Stage 4 of the QA tester workflow. Turns the results of an executed QA run (test-results.md and its screenshots) into a test report for stakeholders (test-report.md plus a PDF with every use case and its screenshot evidence) and a defect list grouped by root cause (defects.md), and lets the user decide which side observations become defects. Use after execute-tests, when the user wants a test report, a defect list or bug report, or wants to promote or dismiss candidate defects in a QA run.
argument-hint: <run-folder>
---

# Write report (stage 4)

You are a QA lead writing up a finished test run. Two readers:
- a **stakeholder** (manager, client) who wants to know what works, what doesn't and what is still unknown — `test-report.md`;
- a **developer** who has to reproduce and fix each problem — `defects.md`.

You report what stage 3 recorded. You don't re-run tests and you don't change
results. A human decides which observations become defects.

## Inputs

A run folder `qa-runs/<run-name>/` containing:
- `test-results.md` (required — if missing, stop and suggest running `execute-tests`)
- `use-cases.md` (required — steps, test data and expected results)
- `requirements.md` and `requirements-review.md` (for coverage and open questions)
- `evidence/` (screenshots linked from the results)

If `defects.md` already exists, this is an **update**: see Step 7.

## Step 1 — Read and check

1. Read all input files.
2. **Evidence check:** every evidence link in `test-results.md` must point to a
   file that exists. List missing files in the report's **Evidence check**
   section. Don't stop for it.
3. Note cases that are `approved` in `use-cases.md` but have no result
   ("Not run").

## Step 2 — Classify every case

Use the result stage 3 gave, then refine it into one of these:

| Class | When |
|---|---|
| **Pass** | Result Pass, and nothing in its observations says the check wasn't really done |
| **Pass with caveat** | Result Pass, but the observations say the condition under test wasn't in place or the check was only partly done (e.g. "this case didn't test what it was meant to test") |
| **Fail** | Result Fail |
| **Blocked by defect** | Result Blocked because of an app problem found in this run (link the defect) |
| **Blocked (other)** | Result Blocked for another reason: setup, environment, missing secret, CAPTCHA |
| **Not run** | Approved but no result |

A **Pass with caveat** does not verify its requirement. Say so plainly in the report.

If you disagree with a result stage 3 recorded, don't change it — add a line to
the report's **Reviewer notes** explaining why.

## Step 3 — Group failures into defects (by root cause)

One defect per **distinct wrong behaviour of the app**, not one per failed case.

- Same wrong behaviour seen in several cases → **one** defect listing all of them.
  *Example: text typed into "Last Name" lands in "First Name". That makes UC-010
  fail, blocks UC-014 and UC-015, and turns UC-011 and UC-013 into passes with
  caveats → one defect, all five cases listed under "Affected cases".*
- Different behaviours in the same case → separate defects.
- Group only on evidence in the results (same field, same button, same message,
  same page). If you're not sure two failures share a cause, keep them separate
  and say they may be related.

For each defect:
- **ID:** `DEF-001`, `DEF-002`, … Never renumber after the user has seen the file.
- **Title:** what's wrong, in one line, from the user's point of view ("Sorting the products has no effect"), not a guess at the cause.
- **Expected:** quoted from the use case's expected result (and its requirement).
- **Actual:** taken from the **Observed** column — concrete, no new interpretation.
- **Steps to reproduce:** setup + steps from the case, with the test data. Secrets stay as placeholders (`$QA_PASSWORD`).
- **Evidence:** links to the screenshots, relative to the run folder.
- **Severity** — pick by this rule:

  | Severity | Rule | Example |
  |---|---|---|
  | Critical | A core flow can't be completed and the user has no way around it | Can't finish checkout |
  | Major | A required function doesn't work, but the user can still reach their goal another way | "Remove" fails on the products page but works in the cart |
  | Minor | It works, but a detail is wrong or inconsistent | Wrong total format, misleading label |
  | Trivial | Cosmetic only | Misaligned button |

- **Priority:** leave as `to be set` — it's a business decision for a human.
- **Status:** `new`.

Don't guess at the cause in the code. That's for a later stage (`suggest-fixes`).

## Step 4 — Collect candidate defects

Things stage 3 noticed outside the expected results ("Other observations") and
the caveats from Step 2 are **candidates**, not defects. They weren't judged
against a requirement.

For each one, write a candidate (`CAND-01`, `CAND-02`, …) with:
- what was seen and where (case + evidence link),
- **why it isn't a confirmed defect** (e.g. "no expected result covers images matching the product"),
- a **suggestion**, one of:
  - **Promote** — clearly wrong for any user, and a requirement covers it at least loosely;
  - **Ask the client** — it depends on what the client wants (requirement gap; link a `GAP-xx` or open question if there is one);
  - **Dismiss** — not about the app under test (e.g. errors from a third-party tracking script, the demo password shown on a demo site).

Merge duplicates (the same observation in several cases → one candidate).
Don't create a candidate for something that's already part of a defect.
Checks masked by a defect (Pass with caveat, Blocked by defect) are **not**
candidates: they go in the report's **Not verified and why** with "retest after
DEF-00x is fixed".

**Never promote a candidate yourself.** The user decides in Step 6.

## Step 5 — Requirement coverage

For each requirement in `requirements.md`, give a status:

| Status | When |
|---|---|
| **Verified** | It has at least one case and all its cases are Pass |
| **Failed** | At least one of its cases is Fail |
| **Not verified** | No Fail, but at least one case is Blocked, Pass with caveat or Not run |
| **Not covered** | No cases (e.g. needs clarification) — give the reason from `use-cases.md` |

## Step 6 — Write the files and ask for decisions

Write `defects.md` and `test-report.md` following the **Output format** at the
end of this file. Fill in the report's **Summary** last, in plain language a
non-tester understands (3–5 sentences: what was tested, what works, what's
broken, what's still unknown).

Don't give a go / no-go release decision. Give the facts, and leave the decision
to the reader.

**Build the PDF.** Don't write the PDF yourself — a script does it, so it costs
no tokens and looks the same every time. Run:

```
node "${CLAUDE_PLUGIN_ROOT}/skills/write-report/scripts/build-pdf.mjs" qa-runs/<run-name>
```

It reads the four Markdown files and writes `test-report.html` and
`test-report.pdf` to the run folder: cover with summary and coverage, the
defects, then one page per use case with its steps, checkpoints and screenshots.
It needs Node and a local Chrome or Edge. If it prints `ERROR`, tell the user the
message; the Markdown files are still the complete report.

Then in chat:
1. Counts: defects by severity, requirements by status.
2. The candidate table: `ID | What | Suggestion`.
3. Ask the user to decide each candidate: **promote**, **dismiss**, or **keep open**
   — e.g. "promote CAND-01, dismiss the rest". Stop and wait.

## Step 7 — Apply decisions and updates

When the user responds (now or in a later conversation):

1. **Re-read `defects.md` and `test-report.md` from disk** — the user may have
   edited them (e.g. set priorities, changed a severity). Keep their edits.
2. **Promote** → add a defect with the next free `DEF` ID. Its **Basis** is
   "Observation in UC-xxx, promoted by the user on <date>". If no requirement
   covers it, its Requirements line says `none — requirement gap`. Mark the
   candidate `promoted → DEF-00x`.
3. **Dismiss** → mark the candidate `dismissed` with the user's reason if given. Keep it in the file.
4. Update the counts, the decision log and the report's summary.
5. Run the PDF script again (Step 6) so the PDF matches.

**After a re-run of stage 3** (`test-results.md` is newer than `defects.md`):
- keep existing defect IDs and human edits;
- a defect whose affected cases now all pass → Status `retest passed — confirm and close` (only a human closes a defect);
- new failures → new defects with new IDs;
- regenerate `test-report.md` for the latest results, then the PDF.

## Rules

- Report only what's in the run files. Never invent results, steps, or evidence.
- Never change `test-results.md` or `use-cases.md`.
- No secrets in either file — placeholders only.
- Write each defect so a developer who never saw this run can reproduce it.
- Keep candidates and defects apart: a defect means a human or a requirement says it's wrong.

## Output format

### `defects.md`

```markdown
# Defects — <run-name>

- **Target URL:** <url>
- **From:** test-results.md (executed <YYYY-MM-DD>)
- **Defects:** <n> · Critical <n> · Major <n> · Minor <n> · Trivial <n>
- **Candidates:** <n> open · <n> promoted · <n> dismissed

| ID | Title | Severity | Priority | Status | Affected cases |
|---|---|---|---|---|---|
| DEF-001 | <title> | Critical | to be set | new | UC-010, UC-014, UC-015 |

---

## DEF-001 — <title>

- **Severity:** Critical <!-- Critical | Major | Minor | Trivial; see the rule in write-report -->
- **Priority:** to be set <!-- set by a human -->
- **Status:** new <!-- new | retest passed — confirm and close | closed (human only) -->
- **Requirements:** FR-10
- **Basis:** Failed checkpoint in UC-010 <!-- or: Observation in UC-xxx, promoted by the user on <date> -->
- **Affected cases:** UC-010 (Fail) · UC-014, UC-015 (Blocked) · UC-011, UC-013 (Pass with caveat)

**Steps to reproduce**

1. <setup step, e.g. "Log in as problem_user with $QA_PASSWORD">
2. <step>
3. <step>

**Expected:** <quoted from the use case expected result>

**Actual:** <from the Observed column>

**Evidence:** [UC-010 step 4](evidence/UC-010/step-04.png) · [UC-010 fields](evidence/UC-010/step-03-fields.png)

---

## Candidate defects

| ID | What was seen | Where | Why not a defect yet | Suggestion | Decision |
|---|---|---|---|---|---|
| CAND-01 | <observation> | UC-005 ([step-02](evidence/UC-005/step-02.png)) | <reason> | Promote | open <!-- open | promoted → DEF-00x | dismissed: <reason> --> |

## Decision log

| Date | Change |
|---|---|
| <YYYY-MM-DD> | Created <n> defects and <n> candidates from test-results.md |
```

### `test-report.md`

```markdown
# Test report — <run-name>

- **Application:** <url> (test environment, confirmed by the user)
- **Executed on:** <date and time range, from test-results.md>
- **Test account(s):** <usernames used>
- **Scope:** <n> requirements · <n> approved use cases · <n> executed
- **Prepared on:** <YYYY-MM-DD> from test-results.md, use-cases.md, requirements-review.md

## Summary

<3–5 plain sentences: what was tested, what works, what's broken, what's still unknown. No release decision.>

## Results

| Result | Cases |
|---|---|
| Pass | <n> |
| Pass with caveat | <n> |
| Fail | <n> |
| Blocked by defect | <n> |
| Blocked (other) | <n> |
| Not run | <n> |

## Requirement coverage

| Requirement | Status | Cases | Notes |
|---|---|---|---|
| FR-01 | Verified | UC-001 | |
| FR-06 | Failed | UC-006 | DEF-002 |
| FR-10 | Failed | UC-010–UC-013 | DEF-001; first-name and postal-code checks masked (UC-011, UC-013) |
| FR-07 | Not covered | — | Needs clarification (question 1) |

**Verified:** <n> of <n> · **Failed:** <n> · **Not verified:** <n> · **Not covered:** <n>

## Defects

| ID | Title | Severity | Affected cases |
|---|---|---|---|
| DEF-001 | <title> | Critical | UC-010, UC-014, UC-015 |

Details, steps to reproduce and evidence: [defects.md](defects.md).

## Not verified and why

- <UC-xxx / FR-xx: why it couldn't be verified, and what's needed (e.g. "retest after DEF-001 is fixed")>

## Open items

- **Candidate defects waiting for a decision:** <CAND-xx list, or none>
- **Open questions for the client:** <blocking questions from requirements-review.md still unanswered>

## Reviewer notes

<Disagreements with stage 3 results, anything unusual about the run, or "none".>

## Evidence check

<"All <n> evidence files present." or the list of missing files.>

## Case results

| Case | Title | Result | Defect |
|---|---|---|---|
| UC-001 | <title> | Pass | |
| UC-011 | <title> | Pass with caveat | DEF-001 |
```
