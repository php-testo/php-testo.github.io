---
title: "Migrate to Testo"
llms: prompt
llms_description: "Port an existing PHPUnit or Pest suite to Testo: set up a restore point, convert the mechanical bulk with testo/bridge-rector, finish the structural pass by hand, and verify nothing was lost."
prompt_category: "Migration"
---

# Migrate to Testo

Migrate this project's PHPUnit (or Pest) test suite to [Testo](https://github.com/php-testo/testo). Follow the steps in order; the first one is blocking.

**Recommended first step: get the migration skill.** Testo ships `testo-migrate-from-phpunit`, and it is the best-worked route for this job — the full construct mapping, scripts that scan for residual PHPUnit constructs and batch the work, a per-file porting template, and gates at each phase. If the skill is already available to you, load it and follow it. If it is not, set up skill syncing first — `composer require --dev llm/skills` and one `composer skills:init`, per <https://php-testo.github.io/docs/ai/prompts/skills.md> — and then load it.

The steps below are the same plan in short form, for a project where skills cannot be installed.

## 0. Read the docs first

Fetch `https://php-testo.github.io/llms.txt` before rewriting anything, and `https://php-testo.github.io/llms-full.txt` when it does not answer a question. Testo is **not** source-compatible with PHPUnit: assertion argument order flips, discovery is attribute-based, and there is no base class. Check every construct against the docs as you port it.

## 1. Restore point (blocking)

Migrating tests is a breaking change to the suite, and it may leave it red for a while.

1. Run `git status --short`. If the tree is dirty, stop and ask to commit or stash first — a rollback must not discard unrelated work.
2. Create a dedicated branch: `git checkout -b migrate-to-testo`.
3. State the rollback plan plainly, and wait for acknowledgement before touching a single test.

If the project is not under version control, say that migrating without a restore point is unsafe and ask for git (or a backup copy) before continuing.

## 2. Pick the scope

Migrate one slice at a time — `tests/Unit` is the usual first cutover, since pure, mock-light tests port cleanly. Ask which scope to take if it is not obvious, and carry the chosen directories into every later step.

Never run PHPUnit and Testo against the same tests in CI: a slice belongs to exactly one runner at a time.

## 3. Install

Testo is set up here exactly as in any other project, so don't reinvent that part: work through the initialization prompt — <https://php-testo.github.io/docs/ai/prompts/init.md>. It installs `testo/testo`, generates `testo.php` with `vendor/bin/testo init`, and adds a CI job. Skip the step if Testo is already configured in this project.

The migration needs two more packages — Rector itself and the rule set that converts PHPUnit into Testo:

```bash
composer require --dev testo/bridge-rector rector/rector
```

Review the generated `testo.php` against the real layout before going further: Rector ports tests into the directories declared there.

The CI job that prompt adds runs Testo across the whole project — while the migration is in flight, narrow it to the chosen slice (`--suite` or `--path`) so the same tests are not also run under PHPUnit.

## 4. Convert mechanically with Rector

Point `rector.php` at the in-scope directories and pull in the conversion set:

```php
// rector.php
use Rector\Config\RectorConfig;
use Testo\Bridge\Rector\Set\TestoRectorSetList;

return RectorConfig::configure()
    ->withPaths([__DIR__ . '/tests/Unit'])
    ->withSets([TestoRectorSetList::PHPUNIT_TO_TESTO]);
```

```bash
vendor/bin/rector process --dry-run   # review first
vendor/bin/rector process
```

Review the result with `git diff` before committing.

For a Pest suite the bridge only converts `expect()->toX()` chains (`TestoRectorSetList::PEST_TO_TESTO`) — the `test()`/`it()` closures still have to be restructured into classes by hand. Treat Pest as a mostly manual port with that set as a helper.

## 5. Finish the structural pass by hand

Rector does the mechanical bulk, not the whole migration. What is left for you, per file:

- Drop `extends PHPUnit\Framework\TestCase` and the PHPUnit imports; Testo needs no base class.
- Make discovery explicit with `#[Test]` — put it on the class when every public method is a test, on individual methods otherwise.
- Replace anything the set left untouched: PHPUnit mocks, custom constraints, and other constructs with no faithful counterpart. They are left in place deliberately rather than dropped, so grep for leftovers.
- Port lifecycle hooks to `#[BeforeTest]`, `#[AfterTest]`, `#[BeforeClass]`, `#[AfterClass]`.

Keep the assertions semantically identical and do not invent extra scenarios — this is a port, not a rewrite.

## 6. Verify

```bash
vendor/bin/testo --json
```

Iterate against the JSON report, narrowing the run with `--filter`, `--path` or `--suite` while fixing, and do a full run at the end. Exit codes: `0` passed, `1` failures, `2` invalid command or configuration.

Compare the test count against the old PHPUnit run — a migration that quietly loses tests looks green.

## 7. Clean up

Once the slice is green under Testo, remove those directories from `phpunit.xml` and from the CI job, and add the Testo run in their place. Drop `phpunit/phpunit` from `composer.json` only when nothing is left on it.

## 8. Report

Summarize: which directories were migrated, how many tests ran before and after, what Rector handled versus what you ported by hand, anything that could not be converted faithfully, and what still runs on PHPUnit.
