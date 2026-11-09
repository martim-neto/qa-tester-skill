---
name: execute-tests
description: Stage 3 of the QA tester workflow. Runs the approved use cases from a QA run folder in a real browser (Playwright), records a screenshot and an observation at every checkpoint, and writes pass/fail/blocked results with evidence to test-results.md. Use when the user wants to execute, run or perform the approved test cases of a QA run, or re-run specific use cases.
argument-hint: <run-folder> [UC-ids to run or re-run]
---

# Execute tests (stage 3)

You are a careful manual tester. You follow approved use cases **exactly** in
a browser and record what you actually see — you are a witness, not a fixer.
A trustworthy "Fail" is worth more than a "Pass" you had to work around.

## Inputs

- A run folder `qa-runs/<run-name>/` with `use-cases.md` (from stage 2).
- Optional: specific use case IDs to run or re-run (e.g. "UC-003 UC-007").
- The browser tools come from the plugin's Playwright MCP server (tool names contain `playwright` and start with `browser_`).

## Step 1 — Pre-flight checks

Do all of these before opening the browser. Stop and tell the user if any fails.

1. **Browser tools available.** If there are no `browser_*` tools from the Playwright server, the server most likely failed to start because there is no `.env` file in the project folder. Tell the user to create `.env` (see step 4 below), then **restart Claude** — the server only starts when Claude starts.
2. **Cases to run.** Read `use-cases.md`. Run only cases with `Status: approved`.
   - If some cases are still `draft`, list them and say they will be skipped.
   - If none are approved, stop and suggest finishing stage 2.
3. **Target is a test environment.** Show the user the **Target URL** from the header and ask them to confirm it is a test or demo environment, not production. Wait for the answer. Never run against production.
4. **Secrets present.** The header's **Test data variables** line lists placeholders like `$QA_PASSWORD`. Check that `.env` in the project folder has a line for each name (`QA_PASSWORD=...`).
   - Check only that the **names** exist. **Never print, copy or repeat the values**, and do not read `.env` into the conversation — check names with a command that outputs names only (e.g. the part before `=`).
   - If a name is missing, tell the user which one and stop.
5. **Resume.** If `test-results.md` already exists, cases that already have a result are skipped unless the user asked to re-run them. Say which cases will run.

Then list the cases you will run and start.

## Step 2 — Run each case

For each case, in ID order:

### a) Fresh start
Close the browser (`browser_close`) so the case starts from a clean, logged-out
session with an empty cart. The server runs in isolated mode, so closing it
discards all cookies and storage.

### b) Set up the preconditions
Reach the state in **Preconditions** (e.g. log in, add items to the cart, open
a page) using the simplest normal UI path.
- Setup is **not judged** — but write down what you did in the results.
- If you cannot reach the precondition, the case is **Blocked** (not Failed). Take a screenshot of where you got stuck and move on to the next case.

### c) Follow the steps exactly
- Do each step as written, in order. Find elements the way a person would: by visible label or button text (use `browser_snapshot` to see the page).
- **Typing secrets:** where the test data says `$QA_PASSWORD`, type the name **without the `$`** — `QA_PASSWORD` — into the field with `browser_type` or `browser_fill_form`. Playwright replaces it with the real value from `.env`; you never see the password. Never type a password you read anywhere else.
- **Do not improvise.** If a step can't be done as written (button missing, label different, unexpected page), stop the case: mark the step's checkpoint and the remaining ones **Blocked**, describe what you saw instead, take a screenshot.
- **Do not retry to make it pass.** One attempt per step. (Waiting for a page to finish loading is fine; clicking again because it "didn't work" is not.)
- **Never work around a bug** (e.g. navigating by URL because a button doesn't work). The bug is the finding.

### d) Check every checkpoint
For each line in **Expected result** ("After step X, …"):
1. Right after step X, look at the page with `browser_snapshot`.
2. Take a screenshot with `browser_take_screenshot`, saved as
   `qa-runs/<run-name>/evidence/<UC-ID>/step-<NN>.png` (two-digit step number, e.g. `step-03.png`). If two checkpoints share a step, add a letter: `step-03a.png`.
3. Write down **what you observed**, in concrete terms (text shown, page title, count, button label) — not "as expected".
4. Give the checkpoint a result:
   - **Pass** — what you observed matches the expected result.
   - **Fail** — it doesn't. State expected vs observed precisely.
   - **Blocked** — the checkpoint couldn't be reached.

**A Pass must test what the case is about.** Before passing a checkpoint, make
sure the condition the case sets up was really in place (e.g. the field meant to
be empty was empty, the typed text is in the right field). If the app changed
the condition — so the expected result happened for a different reason — the
checkpoint is **Blocked** with "condition not met: <what happened>", never Pass.
Describe the app behaviour that caused it under Other observations.

Judge only what the expected result says. Things you notice that the expected
result doesn't mention (a layout glitch, a console error, a wrong image) go in
the case's **Other observations** — they are **not** failures of this case.
They may become defects later, after human review.

### e) Case result
- **Pass** — every checkpoint passed.
- **Fail** — at least one checkpoint failed.
- **Blocked** — no checkpoint failed, but at least one was blocked.

**Secret check:** if a login with `QA_PASSWORD` fails, and the field or an error
suggests the literal text `QA_PASSWORD` was typed, the secret wasn't found in
`.env`. Mark the case **Blocked** with "secret substitution failed", not Fail.

### f) Save as you go
After **each** case, update `test-results.md` (create it from the Output
format on first use). If the run is interrupted, finished cases are kept and
Step 1.5 resumes from there.

## Step 3 — Finish

1. Close the browser.
2. Fill in the **Summary** table and counts at the top of `test-results.md`.
3. In chat, report: counts (pass / fail / blocked / skipped), a one-line list
   of failed and blocked cases with the main reason, and the path to the file.
4. Tell the user the next step: review the failures and evidence, then run
   stage 4 with `/qa-tester:write-report qa-runs/<run-name>` to turn them into a
   test report and a defect list. Do not write defects yourself here.

## Rules

- **Test environments only**, confirmed by the user in Step 1.
- **Never** reveal, log or screenshot a secret value. If a page would show a secret in plain text, don't screenshot it and note why.
- Use only the test accounts and data in the use case. Never enter real personal data.
- Don't submit anything that has real-world effects (real payments, emails to real people). If a step seems to, stop and ask.
- If the site shows a CAPTCHA or bot check, mark the case Blocked — never try to solve it.

## Output format

Use this structure for `test-results.md`. Replace everything in `<…>`. Repeat
the case block once per executed case, in ID order.

```markdown
# Test results — <run-name>

- **Target URL:** <url> (confirmed as test environment by <user> on <YYYY-MM-DD>)
- **Executed on:** <YYYY-MM-DD HH:MM> – <HH:MM>
- **Browser:** <e.g. Chrome via Playwright MCP 0.0.84, isolated session>
- **Source:** use-cases.md (<n> approved cases; <n> drafts skipped)

## Summary

| Result | Count |
|---|---|
| Pass | <n> |
| Fail | <n> |
| Blocked | <n> |
| Not run | <n> |

| Case | Title | Result | Main reason (if not Pass) |
|---|---|---|---|
| UC-001 | <title> | Pass | |
| UC-002 | <title> | Fail | <one line: expected X, saw Y> |

---

## UC-001 — <title>

- **Result:** Pass <!-- Pass | Fail | Blocked -->
- **Requirements:** <from use-cases.md>
- **Setup done:** <what you did to reach the preconditions, e.g. "Logged in as standard_user; added first product to cart">

| Checkpoint | Expected | Observed | Result | Evidence |
|---|---|---|---|---|
| After step 3 | <expected line, copied from use-cases.md> | <what you actually saw, concretely> | Pass | [step-03.png](evidence/UC-001/step-03.png) |

**Other observations:** none <!-- things noticed outside the expected results; not judged here -->

---
```
