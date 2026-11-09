---
name: review-requirements
description: Stage 1 of the QA tester workflow. Reviews client functional requirements for testability — finds ambiguities, gaps, contradictions and missing acceptance criteria — and writes requirements-review.md into a QA run folder. Use when the user gives functional requirements, a spec or user stories and wants them checked, or wants to start a new QA/test run.
argument-hint: <path-to-requirements-file> [run-name]
---

# Review requirements (stage 1)

You are a senior QA analyst. Your job is to read functional requirements and
decide whether each one can be **tested as written** — before anyone writes a
single test case. You do not write test cases here; that is stage 2.

## Inputs

- A requirements document: a file path (.md, .txt) or text pasted in chat — **or** a run folder that already has `requirements.md` (made by `import-document`).
- PDF, Word and other formats: run `import-document` first. It converts the file to Markdown with MarkItDown, which costs far fewer tokens than reading the file directly.
- Optional: a run name. If none is given, use `YYYY-MM-DD-<short-topic>` (e.g. `2026-11-09-saucedemo`).

If the input is unclear (no requirements given, or several candidate files), ask the user before continuing.

## Step 1 — Create the run folder

If the input is a run folder that already has `requirements.md`, use it and go
to Step 2. Otherwise:

1. Create `qa-runs/<run-name>/` in the current working directory.
   If it already exists, ask whether to overwrite or pick a new name.
2. Copy the requirements into `qa-runs/<run-name>/requirements.md` **verbatim**
   (do not reword anything). Every later stage reads this copy, so it must
   match the source.

## Step 2 — Identify each requirement

- Use the IDs from the document (`FR-01`, `REQ-3`, …) if it has them.
- If it doesn't, assign `FR-01`, `FR-02`, … in order of appearance and say so in the review.
- If one paragraph contains several distinct behaviours, split it into
  `FR-03a`, `FR-03b` and note the split.

## Step 3 — Check each requirement

Check every requirement against these criteria:

| Check | Question to ask | Typical problem |
|---|---|---|
| **Clear** | Could two testers read it differently? | Vague words: "fast", "user-friendly", "appropriate", "etc.", "should support" |
| **Testable** | Is there an observable result to compare against? | No expected outcome, or outcome only visible in the backend |
| **Complete** | Are error cases, limits and roles covered? | Only the happy path is described; no max length; no "what if it fails" |
| **Consistent** | Does it contradict another requirement? | Two different rules for the same field |
| **Atomic** | Does it describe one behaviour? | "The user can log in, edit their profile and log out" |

Then give each requirement **one verdict**. Decide by asking: *"Can a tester
decide pass or fail for the behaviour this requirement describes?"*

- **Testable** — yes, from the text alone. Small open points that don't change the pass/fail decision (exact error wording, default sort order, tie order) are noted as minor issues but **do not** downgrade the verdict.
  *Example: "Wrong credentials show an error and the user stays on the login page" — testable even though the error text isn't given.*
- **Testable with assumptions** — yes, but only after assuming something the text doesn't say, and that assumption **changes what counts as a pass**. List each assumption so the client can confirm it.
  *Example: "Mandatory fields" with no stated behaviour when empty → assume an error is shown and the user can't continue.*
- **Needs clarification** — no, the core of the requirement is undefined (a missing number, rule or criterion), so any pass/fail decision would be a guess.
  *Example: "Orders above a certain value get free shipping" — no value given.*

If a requirement is partly testable, split it (Step 2) rather than downgrading the whole thing.

## Step 4 — Write the review

Write `qa-runs/<run-name>/requirements-review.md` following the
**Output format** at the end of this file.

Rules:
- **Never invent requirements.** If the document is silent about something, record it as a gap or a question — do not fill it in as fact.
- **Judge the document only.** Do not open the application or use what you know about how it behaves — the point is to check what the client wrote, not what was built.
- Number gaps `GAP-01`, `GAP-02`, … so later stages and client questions can refer to them.
- Quote the exact problematic wording when flagging ambiguity.
- Write clarification questions so they can be sent to the client unchanged: one question each, specific, answerable.
- Split the questions into **Blocking** (a requirement can't be tested until it's answered — one per "Needs clarification" item at most) and **Nice to have** (confirms an assumption or closes a gap). Keep Blocking short — it's the list the client must answer. Merge questions that ask about the same thing.
- Keep it short. A requirement with no issues gets one line, not a paragraph.

## Step 5 — Hand off to the user

In chat, give a short summary:
- counts per verdict (e.g. "7 testable, 2 with assumptions, 1 needs clarification"),
- the 3 most important issues,
- how many questions are blocking vs nice to have,
- the path to the review file.

Then tell the user the next step: review the assumptions, and run
`generate-use-cases` on the run folder when ready. Do **not** start stage 2
automatically — the user may want to clarify requirements with the client first.

## Output format

Use this structure for `requirements-review.md`. Replace everything in `<…>`;
the rows and blocks shown are examples — write one per requirement, gap and question.

```markdown
# Requirements review — <run-name>

- **Source:** <original file name or "pasted in chat">
- **Reviewed on:** <YYYY-MM-DD>
- **Requirements found:** <n> (<note if IDs were assigned or requirements split>)

## Summary

| Verdict | Count |
|---|---|
| Testable | <n> |
| Testable with assumptions | <n> |
| Needs clarification | <n> |

<2–4 sentences: overall quality and the biggest risks for testing.>

## Per requirement

| ID | Requirement (short) | Verdict | Issues |
|---|---|---|---|
| FR-01 | <one-line paraphrase> | Testable | — |
| FR-02 | <one-line paraphrase> | Testable with assumptions | Complete: "<quoted wording>" |
| FR-03 | <one-line paraphrase> | Needs clarification | Clear: no threshold defined |

## Details

<Only for requirements that are NOT plainly "Testable". One block each.>

### FR-02 — <title>

- **Issue:** <which check failed and why; quote the wording>
- **Assumption used for testing:** <the assumption, stated so the client can confirm or reject it>

### FR-03 — <title>

- **Issue:** <which check failed and why>
- **Impact on testing:** <what cannot be tested until this is answered>

## Gaps (not covered by any requirement)

| ID | Gap |
|---|---|
| GAP-01 | <behaviour a user would reasonably hit that no requirement describes> |

## Questions for the client

### Blocking — testing can't start for these requirements until answered

1. **[FR-03]** <specific, answerable question>

### Nice to have — confirms an assumption or closes a gap

2. **[FR-02]** <question confirming the assumption>
3. **[GAP-01]** <question about the gap>
```
