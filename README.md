# QA Tester — AI-assisted functional testing skills

A Claude Code plugin that turns client functional requirements into tested,
evidenced results — with a human approving the test plan before anything runs.

> Status: **v0.1 — stages 1 and 2** (requirements review + use case generation).
> Browser execution and reporting are next.

## The workflow

```
 requirements.md
       │
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
 [3] execute-tests       ──► evidence/UC-xxx/…        (coming next)
       │
       ▼
 [4] write-report        ──► test-report.md, defects.md (coming next)
```

| Stage | Skill | Status |
|---|---|---|
| 1 | `review-requirements` | ✅ v0.1 |
| 2 | `generate-use-cases` | ✅ v0.1 |
| 3 | `execute-tests` | planned (Playwright MCP) |
| 4 | `write-report` | planned |
| — | `qa-run` (orchestrator) | planned |
| later | `suggest-fixes` | idea |

## Why it's modular: the run folder contract

Skills never call each other directly. Each one **reads files from a run folder
and writes new files to it**. That means any stage can be re-run, replaced or
improved on its own, and every run leaves a full audit trail.

```
qa-runs/<run-name>/
  requirements.md          input — the client's functional requirements (copied in)
  requirements-review.md   stage 1 output
  use-cases.md             stage 2 output; edited and approved by a human
  evidence/                stage 3 output (planned)
  test-report.md           stage 4 output (planned)
  defects.md               stage 4 output (planned)
```

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

## Quick start with the example

The `examples/saucedemo/` folder has made-up requirements for
[saucedemo.com](https://www.saucedemo.com), a public practice shop.

1. `/qa-tester:review-requirements examples/saucedemo/requirements.md`
2. Read `qa-runs/<run>/requirements-review.md`
3. `/qa-tester:generate-use-cases qa-runs/<run>`
4. Edit `use-cases.md`, then tell Claude which cases to approve

## Rules of use

- **Test environments only** — never point the tester at production.
- **Test accounts only** — never real user credentials.
- **No secrets in run files** — use case files refer to passwords as placeholders
  (`$QA_PASSWORD`); real values live in environment variables or a git-ignored `.env`.
- **Client data** — check your company's AI usage policy before giving the tool
  real client requirements.
- **A human signs off** — the AI drafts the plan and judges results, a person
  approves the plan and reviews the defects.

## Repo layout

```
.claude-plugin/
  plugin.json              plugin manifest
  marketplace.json         lets this repo be installed as a marketplace
skills/
  review-requirements/
    SKILL.md
    templates/requirements-review.md
  generate-use-cases/
    SKILL.md
    templates/use-cases.md
examples/
  saucedemo/requirements.md
```
