---
llms: false
---

# AI Agents

AI agents write Testo tests well — and just as well port existing tests to Testo from other frameworks.

::: tip
The fastest path to your first test: install the package (see [Getting Started](getting-started.md)) and ask an agent to write or migrate tests, pointing it at `llms-full.txt` (see below).
:::

## How agents read Testo's docs

Testo publishes its documentation in the [llms.txt](https://llmstxt.org/) format — a single machine-readable file an AI fetches instead of crawling HTML pages.

| File                                                          | Content                                                | When to use                                                |
|---------------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------------|
| [`/llms.txt`](https://php-testo.github.io/llms.txt)           | Page list with short descriptions and best practices.  | Quick overview of available documentation.                 |
| [`/llms-full.txt`](https://php-testo.github.io/llms-full.txt) | Full text of all documentation pages.                  | When the agent needs complete context for code generation. |

## Typical workflow

The same three steps work for new tests and for porting an existing suite:

1. **Feed the context.** Point the agent at `llms-full.txt` or paste the relevant section.
2. **Describe the task.** Provide the class or function you want to cover — or paste the old test you want to convert.
3. **Review and run.** Check the result and run `vendor/bin/testo`.

### Example prompts

Writing tests from scratch:

```
Documentation: https://php-testo.github.io/llms-full.txt

Using the Testo PHP testing framework, write tests for the following class:

{paste your class here}
```

Migrating from another framework:

```
Documentation: https://php-testo.github.io/llms-full.txt

Rewrite the tests in the following folder to Testo. Keep the same assertions and data providers,
do not invent extra scenarios.

Tests folder: tests/Unit
```

### Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) can fetch URLs during a conversation. Add an instruction to your project's `CLAUDE.md`:

```markdown
When writing PHP tests, use the Testo framework.
Fetch the documentation before writing tests: https://php-testo.github.io/llms-full.txt
```

Claude Code will read this instruction and pull the documentation whenever it generates or migrates tests.

### Cursor, Windsurf, and others

AI-powered code editors let you register external documentation as context. The typical approach is to add the documentation URL once and then reference it in chat.

- **Cursor:** Add the URL via **Settings → Features → Docs → Add new doc**. After indexing, reference it in chat with `@Docs` → select Testo.
- **Windsurf:** Paste the URL directly into a Cascade message.

For any IDE that doesn't support URL indexing, paste the contents of `llms-full.txt` into the chat as context.
