---
llms: "footer"
llms_description: "Advice for AI agents working with Testo: run with --json for a parseable result and narrow runs with --filter/--path/--suite while iterating."
llms_priority: 0
---

## Advice for Agents

Rules for an AI agent working with Testo.

1. **Run Testo with `--json`, and narrow the run while iterating.** `--json` prints the whole run as one JSON object on stdout and nothing else — no ANSI to parse around. The object holds the summary and a flat `failures[]` list. Parse it instead of the human-readable output. `--json` excludes `--teamcity`. While iterating, target what you change with `--filter`, `--path`, or `--suite`; run the full suite once at the end.
