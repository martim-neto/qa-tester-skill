---
name: import-document
description: Stage 0 of the QA tester workflow. Imports a client document (PDF, Word, PowerPoint, Excel, HTML or Markdown) into a new QA run folder — converts it to Markdown with Microsoft MarkItDown to save tokens, works out whether it contains functional requirements or ready-made test/use cases, and saves it as requirements.md or as use-cases.md in the plugin's format. Use when the user gives a requirements or test case document, especially a PDF or Word file, to start a QA run.
argument-hint: <path-to-document> [run-name] [target-url]
---

# Import a document (stage 0)

You turn the client's document into a run folder that the other stages can use.
Two kinds of document are accepted:

- **Functional requirements** → `requirements.md` → next: `review-requirements` (stage 1)
- **Use cases / test cases** the client already wrote → `use-cases.md` → next: approval, then `execute-tests` (stage 3)

**Save tokens:** convert the file with a tool, and only read the converted
Markdown. Never read a PDF or Word file directly unless the user agrees to it
(Step 2).

## Step 1 — Run folder

Create `qa-runs/<run-name>/` (default `YYYY-MM-DD-<short-topic>`). If it exists,
ask whether to overwrite or pick a new name. Copy the original file into
`qa-runs/<run-name>/source/` unchanged, for the audit trail.

## Step 2 — Convert to Markdown

- `.md` or `.txt` → no conversion. Copy it to `qa-runs/<run-name>/source.md`.
- Anything else → use **MarkItDown** (Microsoft, free, runs locally):

1. **Check it's installed:** `markitdown --version`. If that fails, try
   `python -m markitdown --version` (and use `python -m markitdown` below).
2. **If it isn't installed, ask the user** — never install anything without a yes:
   > MarkItDown isn't installed. It converts PDF/Word to Markdown locally, which
   > costs far fewer tokens than me reading the file. Install it with
   > `pip install "markitdown[pdf,docx,pptx,xlsx]"` (needs Python 3.10+)?
   - **Yes** → run the install, check again, continue.
   - **No** → for a PDF, use `pdftotext -layout <file> <out>` if it's available
     (it ships with Git for Windows). Otherwise, offer to read the file directly
     and say it costs more tokens. Wait for the answer.
3. **Convert to a file, not to the chat:**
   `markitdown "<file>" -o "qa-runs/<run-name>/source.md"`
   Don't print the converted text in the terminal; read `source.md` instead.
4. **Check the result.** If `source.md` is empty or has almost no text compared
   with the number of pages, the PDF is probably scanned images. Tell the user
   and offer to read the PDF directly instead (costs more). Wait for the answer.

## Step 3 — What kind of document is it?

Read `source.md` and decide:

| Kind | Signs |
|---|---|
| **Requirements** | Statements of what the system must do ("The user must…", "The system shall…"), user stories, acceptance criteria, numbered FR/REQ items |
| **Use cases** | Test-like items with steps or actions and expected results, often with IDs like TC-/UC-/CT- and preconditions or test data |
| **Both / unclear** | Both kinds in one file, or neither |

Tell the user in one line what you found and why (e.g. "This looks like 18 test
cases: each has steps and an expected result"). For **Both / unclear**, ask
which part to use. Also look for the **target URL**; if it isn't in the document
or the arguments, ask for it when you import use cases (stage 3 needs it).

## Step 4a — Requirements

Write `qa-runs/<run-name>/requirements.md` with the requirements **verbatim**:
- Remove conversion noise only: page headers and footers, page numbers, broken
  line wraps, repeated table headers.
- Keep IDs, wording, numbering and tables. Don't reword, merge or "fix" anything —
  finding problems is stage 1's job.
- If the document has no IDs, keep its order; stage 1 will assign `FR-xx`.

Then tell the user the next step: `/qa-tester:review-requirements qa-runs/<run-name>`.

## Step 4b — Use cases

Write `qa-runs/<run-name>/use-cases.md` in the format of the `generate-use-cases`
skill, so stages 3 and 4 can read it:

```markdown
# Use cases — <run-name>

- **Target URL:** <url>
- **Generated on:** <YYYY-MM-DD> (imported from source/<original file name>)
- **Based on:** source.md — imported client use cases
- **Test data variables:** <`$QA_PASSWORD` — …, or none>
- **Status:** <n> draft · 0 approved · 0 rejected

---

## UC-001 — <title> (client ID: <their ID>)

- **Status:** draft
- **Requirements:** <the requirement IDs the client gave, or "none — imported">
- **Type:** <Positive | Negative | Edge — from the case, or your best reading>
- **Priority:** <from the case, or Medium>
- **Preconditions:** <from the case, made concrete>
- **Test data:** <from the case>
- **Assumptions:** none

**Steps**

1. <one user action>

**Expected result**

- After step <X>, <expected outcome>

---

## Traceability matrix
## Not covered
## Import notes
## Approval log
```

Mapping rules:
- **Keep the client's meaning.** Copy steps and expected results as written. You
  may only reshape: one action per step (split "enter user and password and click
  Login" into three), and turn each expected result into "After step X, …" for
  the step it belongs to (if the case only has one expected result, it belongs to
  the last step).
- **Keep their IDs** in the title (`client ID: TC-12`), so the client can find their case. Our IDs are `UC-001`, `UC-002`, … in document order.
- **No secrets.** If the document has passwords, tokens or keys, never write them
  into `use-cases.md`: use a placeholder (`$QA_PASSWORD`), list it in **Test data
  variables**, and tell the user to put the real value in `.env`. Remind them that
  `source.md` and `source/` still contain it (both are inside the git-ignored `qa-runs/`).
- **Never invent.** If a case has no expected result, a vague one ("works
  correctly"), a missing precondition or a step that can't be done in a browser,
  don't fill the gap with a guess. Keep the case as `draft`, and add a row to
  **Import notes**: `| UC-00x | <problem> | <what the user should decide> |`.
- Fill the **Traceability matrix** from the client's requirement references
  (if any), and log `Imported <n> use cases from <file>` in the **Approval log**.

Everything is imported as **draft**. The client wrote them, but the user still
approves what runs in the browser.

Then show the user a table `ID | Client ID | Title | Import note`, and explain
how to approve: edit `use-cases.md`, or say e.g. "approve all except UC-004" —
the `generate-use-cases` skill handles approvals. After approval, the next step
is `/qa-tester:execute-tests qa-runs/<run-name>`.

## Rules

- Never install software without the user's yes.
- Never send the document anywhere — MarkItDown and pdftotext run locally.
- Never reword requirements; never invent steps or expected results.
- No secrets in `requirements.md` or `use-cases.md`.
