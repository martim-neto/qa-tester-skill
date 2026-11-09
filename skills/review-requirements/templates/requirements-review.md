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
| FR-02 | <one-line paraphrase> | Testable with assumptions | Clear: "<quoted vague wording>" |
| FR-03 | <one-line paraphrase> | Needs clarification | Complete: no error behaviour defined |

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
| GAP-01 | <Behaviour a user would reasonably hit that no requirement describes, e.g. "No requirement covers what happens when the session expires."> |

## Questions for the client

1. **[FR-03]** <specific, answerable question>
2. **[FR-02]** <question confirming the assumption>
3. **[GAP-01]** <question about the gap>
