---
name: qa-run
description: Runs the whole QA tester workflow from one command — import a requirements or use case document (PDF, Word, Markdown), review requirements, generate use cases, execute them in the browser, and write the report, PDF and defects — stopping only where a person must decide. Also resumes an unfinished QA run folder from where it stopped. Use when the user wants to test an application end to end from a document, run "the full QA flow", or continue a QA run.
argument-hint: <document | run-folder>
---

# QA run (orchestrator)

You don't test anything yourself here. You work out which stage comes next,
run that stage's skill, and stop at the points where a person has to decide.
All state lives in the run folder, so a run can be continued in any later
conversation.

## Input

- A **document** (PDF, Word, Markdown…) → start a new run with `import-document`.
- A **run folder** (`qa-runs/<run-name>/`) → continue it.
- Nothing → list the folders in `qa-runs/` with their current stage (see the
  table below) and ask which one to continue, or which document to start from.

## Work out the next stage

Look at the files in the run folder (don't read them all — file names and the
status lines are enough), and take the **first** row that matches:

| Run folder state | Next | Who |
|---|---|---|
| No run folder yet | `import-document` | AI |
| `requirements.md`, no `requirements-review.md`, no `use-cases.md` | `review-requirements` | AI |
| `requirements-review.md`, no `use-cases.md` | ✋ **Gate 1** → `generate-use-cases` | Human, then AI |
| `use-cases.md` has `draft` cases | ✋ **Gate 2**: approve the use cases | Human |
| An approved case has no result in `test-results.md` (or the file doesn't exist) | ✋ **Gate 3** inside `execute-tests` (confirm the test environment), then it runs | Human, then AI |
| `test-results.md`, and `defects.md` missing or older | `write-report` | AI |
| `defects.md` has `open` candidates | ✋ **Gate 4**: promote or dismiss candidates | Human |
| Otherwise | Done — show the final summary | — |

## Run a stage

Load the stage's skill with the Skill tool (`qa-tester:<skill-name>`) and follow
it **completely** with the run folder as input, including its own pre-flight
checks and stopping points. Don't shortcut or merge stages.

After an AI stage finishes and its files are written, say in one line what it
produced, then go to the next stage on your own — unless the next row is a gate.

## The gates (always stop and wait)

| Gate | Show the user | Continue when |
|---|---|---|
| **1. After the requirements review** | Verdict counts and the **blocking** client questions | The user says to continue (they may want to ask the client first) |
| **2. Approve use cases** | The case table (stage 2 or import shows it) | No case is `draft`. Approvals and edits are handled by `generate-use-cases` |
| **3. Test environment** | The target URL, and how many cases will run in the browser | The user confirms it's a test environment (inside `execute-tests`) |
| **4. Candidate defects** | The candidate table | Every candidate is promoted, dismissed or deliberately kept open |

Never pass a gate for the user: never approve cases, confirm an environment or
decide candidates on your own. When the user answers a gate, apply the answer
with the stage's skill, then continue with the table above.

## Done

When the run is complete, show:
- results: pass / fail / blocked counts,
- defects by severity,
- requirements verified / failed / not verified / not covered,
- the files: `test-report.pdf` (to share), `test-report.md`, `defects.md`, `evidence/`.

## Rules

- One run folder per run; never mix files from different runs.
- The stage skills' rules all apply (test environments only, no secrets, never invent).
- If a stage stops with an error, stop too and tell the user what's needed — don't skip ahead.
