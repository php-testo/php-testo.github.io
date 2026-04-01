---
llms: false
---

# AI Agents

Testo documentation supports the [llms.txt](https://llmstxt.org/) standard — a machine-readable format that helps AI agents quickly understand the framework and generate correct tests.

## What is llms.txt?

llms.txt is a convention for providing LLM-friendly documentation. Instead of parsing HTML pages, an AI agent fetches a single structured file with all the essential information about the project.

Testo provides two endpoints:

| File                                                          | Content                               | When to use                                                |
|---------------------------------------------------------------|---------------------------------------|------------------------------------------------------------|
| [`/llms.txt`](https://php-testo.github.io/llms.txt)           | Page list with short descriptions.    | Quick overview of available documentation.                 |
| [`/llms-full.txt`](https://php-testo.github.io/llms-full.txt) | Full text of all documentation pages. | When the agent needs complete context for code generation. |

::: tip
If your AI agent supports a context window of 100K+ tokens, use `llms-full.txt` — it contains everything needed to write tests correctly without additional requests.
:::

## Using AI to Write Tests

Most AI agents (Claude, ChatGPT, Cursor, Copilot, etc.) can use Testo documentation as context. The general approach:

1. **Feed the context.** Point the agent at `llms-full.txt` or paste the relevant documentation section.
2. **Describe what to test.** Provide the class or function you want to cover with tests.
3. **Review and run.** Check the generated tests and run them with `vendor/bin/testo run`.

### Example Prompt

```
Using the Testo PHP testing framework, write tests for the following class:

{paste your class here}

Documentation: https://php-testo.github.io/llms-full.txt
```

### Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) can fetch URLs during a conversation. Add an instruction to your project's `CLAUDE.md`:

```markdown
When writing PHP tests, use the Testo framework.
Fetch the documentation before writing tests: https://php-testo.github.io/llms-full.txt
```

Claude Code will read this instruction and fetch the documentation when it needs to generate tests.

### Cursor, Windsurf, and others

AI code editors allow you to add external documentation as context. The typical approach is to register the documentation URL in the editor settings and then reference it in the chat.

- **Cursor:** Add the URL via **Settings → Features → Docs → Add new doc**. After indexing, reference it in chat with `@Docs` → select Testo.
- **Windsurf:** Paste the URL directly into a Cascade message.

You can also paste the contents of `llms-full.txt` into the chat as context for any AI-powered IDE that doesn't support URL indexing.
