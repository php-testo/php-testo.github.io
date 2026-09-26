---
title: "Set Up Agent Skills"
llms: prompt
llms_description: "Wire up the llm/skills Composer plugin so agents pick up Testo's bundled skills: pre-allow the plugin, require llm/skills ^1.13 in the project even when it is installed globally, bootstrap skills.json with skills:init, mirror the target into each agent's directory, and verify the dependency, the config and the synced skills."
prompt_category: "Setup"
---

# Set Up Agent Skills

Make the AI skills that ship with [Testo](https://github.com/php-testo/testo) available to the agents working on this project. Work through the steps in order and report the result.

Testo bundles a skill per scenario — writing tests, data providers, test doubles, async tests, benchmarks, coverage, mutation testing, migrating from PHPUnit, authoring plugins, editing `testo.php`. `llms.txt` says *what* the API offers; a skill says *when* to reach for what and where the pitfalls are, and several of them carry ready-made scripts. They live inside the installed package, so an agent only sees them once they are laid out where it looks.

That layout is the job of the [`llm/skills`](https://packagist.org/packages/llm/skills) Composer plugin.

## 1. Collect the agent directories

Claude Code reads `.claude/skills/`, Cursor reads `.cursor/skills/`, other agents have their own conventional paths. Ask which agents work on this project and look at what the repository already has — those paths become the aliases below.

The layout to aim for: one real directory (`.agents/skills`, tool-agnostic) with a link per agent pointing at it, so every agent reads the same files. A single-agent project can just as well make that agent's own path the target.

## 2. Pre-allow the plugin

Composer asks for permission to run a plugin, and an agent's shell run is not the place to discover an interactive prompt. Add the entry to `composer.json` before installing:

```json
{
    "config": {
        "allow-plugins": {
            "llm/skills": true
        }
    }
}
```

## 3. Install and configure in one line

```bash
composer require --dev "llm/skills:^1.13"
composer skills:init --quick --no-interaction \
    --target=.agents/skills --alias=.claude/skills --alias=.cursor/skills
```

Install the package into the project even if the plugin is already installed globally. A line like `[llm/skills] running auto-sync…` during `composer install` only shows that *your* machine has it: teammates and CI don't have your global plugin, and without an entry in `require-dev` nothing syncs for them.

Version 1.13 is the floor: older releases don't know `--quick`, `--target` or `--alias`, and without them `skills:init` writes a config with no aliases. If the command rejects these flags, an older copy of the plugin is answering, usually the global one. Update it (`composer global update llm/skills`) and check that the project got 1.13 or newer.

`skills:init` writes `skills.json` at the project root and syncs right away — the flags decide what lands in the file:

- `--quick` takes every remaining answer from the detected project layout and confirms once; `--no-interaction` makes it final, which is what you want in a scripted run.
- `--target=PATH` — the real skills directory (default `.agents/skills`).
- `--alias=PATH` — repeatable, one per agent path; passing it at all replaces the detected list.
- `--trust=PATTERN` — repeatable, for the project's own skill-shipping vendors. Testo is on the built-in trusted list, and so is any package required directly, so plain Testo setups need none.
- `--no-auto-sync` — opt out of re-syncing after `composer install` / `update`. Auto-sync is on by default; leave it on so skills follow the installed versions.
- `--no-discovery` — consider only packages that declare `extra.skills`. Discovery is on by default, which is how a package that merely ships `SKILL.md` files is picked up.
- `--force` — re-run over an existing `skills.json`. Without it the command refuses to overwrite one, so check whether the file is already there and report what it says instead of forcing it.

Left alone in a project with no configuration, the plugin makes the same offer by itself on the next `composer install` / `update` — one confirmation. That path needs an interactive terminal, so run the command explicitly.

## 4. Verify

```bash
composer show --direct llm/skills   # the package is a direct dependency of the project
composer skills:show                # what is synced, what is skipped, and why
composer skills:update              # re-sync by hand; --dry-run previews
```

The step is done when all of this holds:

- `composer show --direct llm/skills` lists the package at version 1.13 or newer.
- `skills.json` declares the layout from step 1: `aliases` names every agent path, and `target` is present whenever it differs from the default `.agents/skills`. A file with only `dependencies` and an empty `sources` list means `skills:init` ran without the flags — rerun it with `--force` and the flags.
- The target directory holds the `testo-*` skill directories, and every alias path resolves to the target.

Judge by the config, not by a link that happens to be there: a link left over from an earlier attempt resolves just as well, but a fresh clone won't have it.

A `[skip] not trusted` line names a donor waiting for a `--trust` pattern; a directory that already holds real files of its own is reported rather than replaced, and has to be resolved by hand.

Local edits survive a sync: only files the donor actually ships get overwritten, so a `local.md` dropped next to a bundled skill stays put.

## 5. Commit the config, ignore the payload

`skills.json` belongs in git next to `composer.json` — it is what makes the setup reproducible for the whole team. The target directory and the alias links are generated from `vendor/` and rebuilt by auto-sync, so recommend adding them to `.gitignore`; ask before committing them instead, since a team that wants skills available without running Composer may prefer them tracked.

## 6. Report

Report which `llm/skills` version the project requires, what `skills.json` declares, which agent paths are wired to the target, that the `testo-*` skills are present, and anything `skills:show` skipped along with the reason.
