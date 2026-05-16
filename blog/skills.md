---
title: "Skills for AI Agents"
date: 2026-05-14
description: "Testo now ships a set of AI skills for agents. Plus a Composer plugin that pulls skills from vendor packages into your project automatically."
image: /blog/skills/preview.png
author: Aleksei Gagarin
outline: deep
faqLevel: false
---

# Skills for AI Agents

Today I added a set of **AI skills** to Testo — small instructions that an agent (Claude Code, Codex, and friends) loads on demand when it spots a matching task. They live in the [`skills/`](https://github.com/php-testo/testo/tree/1.x/skills) folder.

## What's inside

Nine skills, one per scenario:

- [`testo-write-tests`](https://github.com/php-testo/testo/blob/1.x/skills/testo-write-tests/SKILL.md) — write a regular <attr>\Testo\Test</attr> class with `Assert` / `Expect` / lifecycle hooks.
- [`testo-data-driven`](https://github.com/php-testo/testo/blob/1.x/skills/testo-data-driven/SKILL.md) — parameterize a test: <attr>\Testo\Data\DataSet</attr>, <attr>\Testo\Data\DataProvider</attr>, <attr>\Testo\Data\DataUnion</attr>, <attr>\Testo\Data\DataZip</attr>, <attr>\Testo\Data\DataCross</attr>.
- [`testo-flaky-tests`](https://github.com/php-testo/testo/blob/1.x/skills/testo-flaky-tests/SKILL.md) — <attr>\Testo\Retry</attr> vs <attr>\Testo\Repeat</attr>: believe it or not, they're not the same thing.
- [`testo-inline-tests`](https://github.com/php-testo/testo/blob/1.x/skills/testo-inline-tests/SKILL.md) — <attr>\Testo\Inline\TestInline</attr> right on methods in `src`.
- [`testo-benchmarks`](https://github.com/php-testo/testo/blob/1.x/skills/testo-benchmarks/SKILL.md) — <attr>\Testo\Bench</attr> and how to read Mean / Median / RStDev.
- [`testo-coverage`](https://github.com/php-testo/testo/blob/1.x/skills/testo-coverage/SKILL.md) — setting up `CodecovPlugin`, <attr>\Testo\Codecov\Covers</attr>, Clover / Cobertura / PHPUnit XML reports.
- [`testo-migrate-from-phpunit`](https://github.com/php-testo/testo/blob/1.x/skills/testo-migrate-from-phpunit/SKILL.md) — migrating tests from PHPUnit — a crowd favorite.
- [`testo-plugin-author`](https://github.com/php-testo/testo/blob/1.x/skills/testo-plugin-author/SKILL.md) — write your own Testo plugin.
- [`testo-configure`](https://github.com/php-testo/testo/blob/1.x/skills/testo-configure/SKILL.md) — assemble or fix up `testo.php`.

::: question Why skills at all if there's already `llms.txt`?
[`llms.txt`](https://php-testo.github.io/llms.txt) tells the agent **what** the API offers. Skills tell it **when** to use what and **where the pitfalls are**. They're short, activated by triggers (phrases from the user), and each one sends the agent off to read `llms.txt` for the details. That way the documentation isn't duplicated, and the skills don't go stale alongside the API.
:::

## But copying them into every project is a chore

Right now, for an agent to actually see these skills, you have to drop them into `.claude/skills/` (or wherever your agent is configured to look). Which means either copy-pasting from `vendor/testo/testo/skills/`, setting up symlinks, or… giving up and not using them at all.

So I built a separate package — **[`llm/skills`](https://github.com/roxblnfk/skills)**.

## `llm/skills` — a Composer plugin for skills

The idea is simple: a Composer package declares in its `composer.json` that it's a skill "donor":

```json
{
    "extra": {
        "skills": {
            "source": "skills"
        }
    }
}
```

A consumer project installs [`llm/skills`](https://packagist.org/packages/llm/skills), and on `composer install` the skills from trusted packages **automatically** end up in `.agents/skills/` (or wherever you point it).

No manual copying, no symlinks, no more "oh no, I forgot to update SKILL.md after `composer update`".

## Come help test it

Just shipped [`llm/skills`](https://github.com/roxblnfk/skills) **v1.0.0**. I have no idea how much demand there'll be for it, so I deliberately didn't pile on features — just a minimal viable mechanism:

- Two commands: `composer skills:update` does the sync, `composer skills:show` is a read-only inspector that tells you what's getting synced, what's skipped, and why. `update` also has a `--dry-run` flag for previewing without writing.
- Declaring the skills folder via `extra.skills.source` in a dependency's `composer.json`.
- Auto-discovery: skills are picked up from a `skills` folder at the package root, even without an `extra.skills` declaration.
- Trusted-vendor whitelist: `extra.skills.trusted` plus `--trust=PATTERN`, with wildcard support (`acme/*`, `*`) and a built-in list of already-trusted packages.
- A "named it, trust it" shortcut: `composer skills:update acme/foo` bypasses the trust list for the duration of the command and turns on auto-discovery for that package along the way.
- Transactional: if two donors declare a skill with the same name, the sync fails *before* touching any files. No half-applied state.
- Non-destructive merge: local edits in `target/<skill>/` survive a sync — only files the donor actually ships get overwritten. You can drop a `local.md` next to someone else's skill and it'll stay.

If you install it and run into something — file an [issue on the repo](https://github.com/roxblnfk/skills/issues). I'm especially curious to hear about scenarios I didn't think of myself: other agents, unusual layouts, security policies in larger teams.

::: warning
The package is 95% vibe-coded, but that's nothing to worry about: it's all covered by tests with a [high MSI](/docs/theory/mutation-testing.md).
:::

## Quick start

1. Add the settings to `composer.json`:

    ```json
    {
        "extra": {
            "skills": {
                "target": ".agents/skills",
                "aliases": [".claude/skills", ".cursor/skills"],
                "trusted": ["my-vendor/*"],
                "discovery": true,
                "auto-sync": true
            }
        }
    }
    ```

    - `target` — the real skills directory (default `.agents/skills`).
    - `aliases` — extra mirror paths (Windows junctions or POSIX symlinks) pointing at `target`. Handy when a project hosts several agents at once: Claude Code, Cursor & friends read the same skills through their own conventional paths, no duplicated files.
    - `trusted` — trusted-vendor patterns (`vendor/*` or `vendor/package`). Testo and a few others are already in the built-in whitelist, so this is usually where you list your own additions.
    - `discovery` — pick up skills from packages that don't declare `extra.skills` but ship a `skills/` folder at the root. `false` by default.
    - `auto-sync` — run `skills:update` automatically after `composer install` / `update`.

2. Install the plugin — it'll pick up the skills and lay them out right away:

    ```bash
    composer require --dev llm/skills
    ```

    Composer will ask for permission to run the plugin (`allow-plugins`) — say yes.

3. See what else is available to sync.

    `composer skills:show` is a read-only inspector that tells you what's syncing, what's skipped, and why. Useful flags:

    ```bash
    composer skills:show                      # current layout
    composer skills:show --discovery          # + packages with a skills/ folder but no extra.skills
    composer skills:show --trust='acme/*'     # + what would unlock if you extended trust
    ```

    Spot a `[skip] not trusted` next to something interesting? Add the vendor to `trusted` and the skills will land on the next sync. For a one-off sync, name the package right in the command: `skills:update acme/foo`.

::: tip
You can install the plugin globally — then `composer skills:show` / `skills:update` work in any project, while the per-project settings (`target`, `aliases`, `trusted`) are still read from the local `composer.json`:

```bash
composer global require llm/skills
```
:::
