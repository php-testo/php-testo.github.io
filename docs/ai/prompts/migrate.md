---
title: "Migrate to Testo"
llms: prompt
llms_description: "Port an existing PHPUnit or Pest suite to Testo: set up a restore point, convert the mechanical bulk with testo/bridge-rector (PHPUNIT_TO_TESTO plus a PHPUNIT_TO_DOUBLE or PHPUNIT_TO_MOCKERY mock set for the library the user picks), finish the structural pass by hand, verify nothing was lost, and tidy the green suite with the TESTO_POLISH set."
prompt_category: "Migration"
---

# Migrate to Testo

Migrate this project's PHPUnit (or Pest) test suite to [Testo](https://github.com/php-testo/testo). Follow the steps in order; the first one is blocking.

**Recommended first step: get the migration skill.** Testo ships `testo-migrate-from-phpunit`, and it is the best-worked route for this job — the full construct mapping, scripts that scan for residual PHPUnit constructs and batch the work, a per-file porting template, and gates at each phase. If the skill is already available to you, load it and follow it. If it is not, set up skill syncing first — `composer require --dev "llm/skills:^1.13"` and one `composer skills:init`, per <https://php-testo.github.io/docs/ai/prompts/skills.md> — and then load it.

The steps below are the same plan in short form, for a project where skills cannot be installed.

## 0. Read the docs first

Fetch `https://php-testo.github.io/llms.txt` before rewriting anything, and `https://php-testo.github.io/llms-full.txt` when it does not answer a question. Testo is **not** source-compatible with PHPUnit: assertion argument order flips, discovery is attribute-based, and there is no base class. Check every construct against the docs as you port it.

## 1. Restore point (blocking)

Migrating tests is a breaking change to the suite, and it may leave it red for a while.

1. Run `git status --short`. If the tree is dirty, stop and ask to commit or stash first — a rollback must not discard unrelated work.
2. Create a dedicated branch. Check for the name first with `git rev-parse --verify --quiet migrate-to-testo`:
   - No such branch — run `git checkout -b migrate-to-testo`.
   - The branch exists — it is most likely left over from an earlier attempt and may sit on a stale base. Ask the user whether to pick a new name, delete the old branch, or continue on it. To continue, run `git log --oneline migrate-to-testo..<main-branch>` and tell the user which commits of the main branch it is missing.
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

Testo core has no mocking, so if the in-scope tests use PHPUnit mocks (`createMock()`, `createStub()`, `getMockBuilder()`), the mocks need a new home — and which library that is, is the user's call. Ask before running Rector, and offer:

- **Double** (`testo/bridge-double`) — the default choice on PHP 8.3+.
- **Mockery** (`testo/bridge-mockery`) — when the project already uses Mockery or has to support PHP 8.2.
- **No library** — every double is rewritten by hand into a stub, fake or other test class. There is no Rector set for this, so it is the slow route; offer it last.

A suite that already uses Mockery can keep it, or move to Double with a dedicated set (see the next step) — ask about that too.

```bash
composer require --dev testo/bridge-double                    # Double
composer require --dev mockery/mockery testo/bridge-mockery   # Mockery
```

Register the matching plugin in `testo.php` — `Testo\Bridge\Double\DoublePlugin` or `Testo\Bridge\Mockery\MockeryPlugin`. Without it nobody verifies the expectations after a test, and a broken mock passes silently.

Review the generated `testo.php` against the real layout before going further: Rector ports tests into the directories declared there.

The CI job that prompt adds runs Testo across the whole project — while the migration is in flight, narrow it to the chosen slice (`--suite` or `--path`) so the same tests are not also run under PHPUnit.

Before touching CI, read step 4 of the initialization prompt, even if you skipped the rest of it: it lists the CI decisions that belong to the user — a project that supports PHP below 8.2, and a job that calls a shared reusable workflow.

## 4. Convert mechanically with Rector

Write a separate, disposable config at the project root — `rector-testo-migration.php`, so an existing `rector.php` stays untouched. Point it at the in-scope directories and pull in the conversion set, plus the mock set for the library picked in the previous step:

```php
// rector-testo-migration.php
use Rector\Config\RectorConfig;
use Testo\Bridge\Rector\Set\TestoRectorSetList;

return RectorConfig::configure()
    ->withPaths([__DIR__ . '/tests/Unit'])
    ->withSets([
        TestoRectorSetList::PHPUNIT_TO_TESTO,
        TestoRectorSetList::PHPUNIT_TO_DOUBLE, // or PHPUNIT_TO_MOCKERY
    ])
    // The rules emit fully qualified names; import them, leaving global classes (\RuntimeException) as written.
    ->withImportNames(importShortClasses: false);
```

Keep `withImportNames()`: without it the converted files end up with `#[\Testo\Test]` written out in full next to an unused `use Testo\Test;`.

`PHPUNIT_TO_TESTO` does not touch mocks at all, and without `TestCase` a `$this->createMock()` call has nothing to run on. Rules come first: whenever a library was picked, let its set convert the mocks, and fix by hand only what the tests then show to be wrong. Leave the mock set out only when the user chose no library — then the doubles become hand-written test classes in step 5. The mock sets:

- `PHPUNIT_TO_DOUBLE` — `createMock()`/`createStub()` with their `expects()`/`method()`/`will*()`/`with()` chains, configured and partial mocks, `willReturnMap()` and PHPUnit constraints → Double.
- `PHPUNIT_TO_MOCKERY` — the same chains → `Mockery::mock()` + `shouldReceive()`.
- `MOCKERY_TO_DOUBLE` — existing Mockery doubles (`mock()`/`spy()`, `shouldReceive()`/`allows()`/`expects()`, `shouldHaveReceived()`, `Mockery::close()`) → Double. Add it only if the user chose to move off Mockery.

```bash
vendor/bin/rector process --config=rector-testo-migration.php --dry-run   # review first
vendor/bin/rector process --config=rector-testo-migration.php
```

Review the result with `git diff` before committing.

For a Pest suite use `TestoRectorSetList::PEST_TO_TESTO`: it turns each `test()`/`it()` and `beforeEach()`/`afterEach()` into a free function with `#[Test]` or a lifecycle attribute, and maps `expect()->toX()` onto `Assert`. `describe()` blocks, `uses()`, named datasets, `arch()` tests and state shared through `$this` are left for you.

## 5. Finish the structural pass by hand

Rector does the mechanical bulk, not the whole migration. What is left for you, per file:

- Check discovery. The set removes a direct `extends PHPUnit\Framework\TestCase` and marks each test method with `#[Test]`, but a class extending an intermediate or custom base class is left as it was — port those by hand, and drop the leftover PHPUnit imports.
- If the user chose no mocking library, rewrite each PHPUnit double into a hand-written stub, fake or spy class under `tests/`.
- Replace anything the sets left untouched: mock forms with no counterpart (`prophesize()`, `getMockForAbstractClass()`, `addMethods()`, `withConsecutive()`), `assertThat()` constraints, and other constructs with no faithful counterpart. They are left in place deliberately rather than dropped, so grep for leftovers.
- Check the lifecycle hooks: whatever the set did not turn into `#[BeforeTest]`, `#[AfterTest]`, `#[BeforeClass]` or `#[AfterClass]` is yours to port.

Keep the assertions semantically identical and do not invent extra scenarios — this is a port, not a rewrite.

## 6. Verify

```bash
vendor/bin/testo --json
```

Iterate against the JSON report, narrowing the run with `--filter`, `--path` or `--suite` while fixing, and do a full run at the end. Exit codes: `0` passed, `1` failures, `2` invalid command or configuration.

Compare the test count against the old PHPUnit run — a migration that quietly loses tests looks green.

## 7. Polish with Rector

Once the slice is green, the `TESTO_POLISH` set tidies it up without changing which tests run: it adds `: void` and `: never` return types, makes test classes `final`, moves `#[Test]` from the methods onto the class, turns one-statement exception tests into `#[ExpectException]`, and merges adjacent assertion chains on the same variable into one.

Run it as its own pass with a second disposable config, `rector-testo-polish.php`. It is the same as the migration config, only with a different set list:

```php
    ->withSets([TestoRectorSetList::TESTO_POLISH])
```

```bash
vendor/bin/rector process --config=rector-testo-polish.php --dry-run   # review first
vendor/bin/rector process --config=rector-testo-polish.php
vendor/bin/rector process --config=rector-testo-polish.php   # again: cleans up traits
```

Then repeat the verification from step 6: the run must stay green and the test count must not change.

## 8. Clean up

Once the slice is green under Testo, remove those directories from `phpunit.xml` and from the CI job, and add the Testo run in their place. Delete `rector-testo-migration.php` and `rector-testo-polish.php`. Drop `phpunit/phpunit` from `composer.json` only when nothing is left on it.

## 9. Report

Summarize: which directories were migrated, how many tests ran before and after, which mock library the doubles moved to, what Rector handled versus what you ported by hand, which CI decisions the user made, anything that could not be converted faithfully, and what still runs on PHPUnit.
