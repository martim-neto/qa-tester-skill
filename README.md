# QA Tester — AI-assisted functional testing skills

A Claude Code plugin that turns client functional requirements into tested,
evidenced results — with a human approving the test plan before anything runs.

> Status: **v0.4** — import from PDF/Word, all four stages, a PDF report with
> screenshot evidence, and one command (`qa-run`) for the whole flow.

## One command

```
/qa-tester:qa-run requirements.pdf        start from requirements
/qa-tester:qa-run client-test-cases.pdf   start from use cases the client already wrote
/qa-tester:qa-run qa-runs/<run-name>      continue a run where it stopped
```

It runs each stage in order and stops only where a person must decide: after
the requirements review, to approve the use cases, to confirm the test
environment, and to decide candidate defects.

## The workflow

```
 client document (PDF, Word, Markdown)
       │
       ▼
 [0] import-document     ──► requirements.md  ── or ──►  use-cases.md (skips 1–2)
       │                     (MarkItDown → Markdown, saves tokens)
       ▼
 [1] review-requirements ──► requirements-review.md   (gaps, ambiguities, questions)
       │
       ▼
 [2] generate-use-cases  ──► use-cases.md             (status: draft)
       │
       ▼
  ✋ Human review — edit cases, set status: approved / rejected
       │
       ▼
 [3] execute-tests       ──► test-results.md, evidence/UC-xxx/step-NN.png
       │
       ▼
 [4] write-report        ──► test-report.md, test-report.pdf, defects.md
       │
       ▼
  ✋ Human review — promote or dismiss candidate defects, set priorities
```

| Stage | Skill | Status |
|---|---|---|
| 0 | `import-document` | ✅ v0.4 (MarkItDown) |
| 1 | `review-requirements` | ✅ v0.1 |
| 2 | `generate-use-cases` | ✅ v0.1 |
| 3 | `execute-tests` | ✅ v0.2 (Playwright MCP) |
| 4 | `write-report` | ✅ v0.4 (+ PDF) |
| — | `qa-run` (orchestrator) | ✅ v0.4 |
| later | `suggest-fixes` | idea |

## Why it's modular: the run folder contract

Skills never call each other directly. Each one **reads files from a run folder
and writes new files to it**. That means any stage can be re-run, replaced or
improved on its own, and every run leaves a full audit trail.

```
qa-runs/<run-name>/
  source/                  the original client document, unchanged
  source.md                stage 0 — the document converted to Markdown
  requirements.md          input — the client's functional requirements (copied in)
  requirements-review.md   stage 1 output
  use-cases.md             stage 2 output; edited and approved by a human
  test-results.md          stage 3 output — pass/fail/blocked per checkpoint
  evidence/UC-xxx/         stage 3 output — one screenshot per checkpoint
  test-report.md           stage 4 output — summary, requirement coverage, open items
  defects.md               stage 4 output — defects by root cause + candidate defects
  test-report.pdf          stage 4 output — report + every use case with its screenshots
```

**Scripts for mechanical work, AI for judgement.** Converting documents
(MarkItDown) and laying out the PDF (`build-pdf.mjs` + local Chrome/Edge) are
done by tools, so they cost no AI tokens and give the same result every time.

`qa-runs/` is git-ignored on purpose: runs can contain client data and screenshots.

## Install

**Try it locally** (from a terminal):

```bash
claude --plugin-dir C:/Users/marti/Desktop/qa-tester-skill
```

**Install from git** (once pushed to a remote), inside Claude Code:

```
/plugin marketplace add <git-url-of-this-repo>
/plugin install qa-tester@qa-tester-marketplace
```

Skills are namespaced by the plugin, e.g. `/qa-tester:review-requirements`.
You can also just describe the task ("review these requirements") and Claude
picks the right skill from its description.

## Setup for importing documents (stage 0)

PDF, Word, PowerPoint and Excel files are converted to Markdown with
[MarkItDown](https://github.com/microsoft/markitdown) (Microsoft, runs locally):

```bash
pip install "markitdown[pdf,docx,pptx,xlsx]"
```

Needs Python 3.10+. If it's missing, the skill asks before installing it. If you
say no, PDFs fall back to `pdftotext` (ships with Git for Windows).

## Setup for the PDF report (stage 4)

Node.js and a local **Chrome or Edge**. Set `QA_PDF_BROWSER` to a browser
executable to choose another one.

## Setup for stage 3 (browser)

The plugin starts its own browser tool,
[Playwright MCP](https://github.com/microsoft/playwright-mcp) `0.0.84`, from
`.mcp.json`. You need:

- **Node.js 18+** (for `npx`)
- **Google Chrome** — or set `QA_BROWSER` to `msedge`, `firefox` or `webkit` before starting Claude
- A **`.env` file in your project folder** with the test secrets your use cases
  reference, e.g.

  ```
  QA_PASSWORD=<test account password>
  ```

> **Create `.env` before starting Claude.** The browser server reads it at
> startup and doesn't start without it. If you add it later, restart Claude.

How secrets stay out of the AI's context: use cases only contain placeholders
(`$QA_PASSWORD`). When typing, Claude passes the *name* (`QA_PASSWORD`) and
Playwright fills in the real value from `.env`; matching values are also masked
in what the browser tool sends back. It's a safeguard, not a vault — use test
accounts only.

The browser runs **visible** and **isolated**: every use case starts from a clean
session with no cookies or saved logins.

## Quick start with the example

The `examples/saucedemo/` folder has made-up requirements for
[saucedemo.com](https://www.saucedemo.com), a public practice shop.

The quick way: create `.env` (step 5), then `/qa-tester:qa-run examples/saucedemo/requirements.md`.

Stage by stage:

1. `/qa-tester:review-requirements examples/saucedemo/requirements.md`
2. Read `qa-runs/<run>/requirements-review.md`
3. `/qa-tester:generate-use-cases qa-runs/<run>`
4. Edit `use-cases.md`, then tell Claude which cases to approve
5. Create `.env` (password is shown on the saucedemo login page), restart Claude, then
   `/qa-tester:execute-tests qa-runs/<run>`
6. `/qa-tester:write-report qa-runs/<run>`, then tell Claude which candidate
   defects to promote or dismiss

Tip: change the username in `use-cases.md` to `problem_user` (saucedemo's
deliberately buggy account) to see real defects.

## Rules of use

- **Test environments only** — never point the tester at production.
- **Test accounts only** — never real user credentials.
- **No secrets in run files** — use case files refer to passwords as placeholders
  (`$QA_PASSWORD`); real values live in environment variables or a git-ignored `.env`.
- **Client data** — check your company's AI usage policy before giving the tool
  real client requirements.
- **A human signs off** — the AI drafts the plan and judges results, a person
  approves the plan, decides which observations become defects, and sets priorities.

## Repo layout

```
.claude-plugin/
  plugin.json              plugin manifest
  marketplace.json         lets this repo be installed as a marketplace
.mcp.json                  starts Playwright MCP (the browser) for stage 3
skills/
  qa-run/SKILL.md                orchestrator: next stage + human gates
  import-document/SKILL.md       PDF/Word → requirements.md or use-cases.md
  review-requirements/SKILL.md   instructions + output format
  generate-use-cases/SKILL.md    instructions + output format
  execute-tests/SKILL.md         instructions + output format
  write-report/SKILL.md          instructions + output formats (report + defects)
  write-report/scripts/build-pdf.mjs   Markdown + screenshots → test-report.pdf
examples/
  saucedemo/requirements.md
```

Each skill's output format lives at the end of its own `SKILL.md`, so the
instructions and the format always load together and no extra file access is
needed outside the user's project.
