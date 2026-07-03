---
outline: [2, 3]
faqLevel: false
llms: true
llms_description: "How to convert test suites between Pest, PHPUnit and Testo with Rector rules, and how to test your own Rector rules from Testo. The testo/bridge-rector package ships three conversion sets (testo-to-phpunit, phpunit-to-testo, pest-to-testo) and a rule-testing toolkit: attach RectorTestingPlugin to a suite and mark a rule with the TestRectorFixtures attribute pointing at *.php.inc fixtures — each fixture runs through a freshly-booted Rector container and is reported as its own data set, no PHPUnit needed."
---

# Rector

[Rector](https://github.com/rectorphp/rector) rewrites PHP code by walking the AST and applying rules. The `testo/bridge-rector` package brings two things to Testo: a set of ready-made rules that **convert test suites between Pest, PHPUnit and Testo**, and a toolkit that lets you **test your own Rector rules with Testo itself** — no PHPUnit required.

<plugin-info class="\Testo\Bridge\Rector\Testing\RectorTestingPlugin" name="RectorTesting" />

## Installation

```bash
composer require --dev testo/bridge-rector rector/rector
```

## Conversion rules

The rules exist to move an existing test suite from one framework to another without rewriting it by hand — for example, to migrate a project from PHPUnit or Pest to Testo, to go back to PHPUnit, or to produce a mirror PHPUnit copy of the suite for a different runner.

Conversion works in three directions, and each one comes as a ready-made Rector set. The convenient way to reference a set is through a <class>\Testo\Bridge\Rector\Set\TestoRectorSetList</class> constant — no path to remember and no need to assemble a list of individual rules by hand.

| Direction | Set constant |
|-----------|--------------|
| Testo → PHPUnit | `TestoRectorSetList::TESTO_TO_PHPUNIT` |
| PHPUnit → Testo | `TestoRectorSetList::PHPUNIT_TO_TESTO` |
| Pest → Testo | `TestoRectorSetList::PEST_TO_TESTO` |

Each set converts the constructs that have a faithful counterpart in the target framework. Anything else is left untouched rather than dropped silently — more on that just below.

### Running a conversion

The adapter adds no CLI command of its own — conversion runs through Rector as usual. Reference the set you need from your `rector.php`, point it at your tests, and run the process:

```php
// rector.php
use Rector\Config\RectorConfig;
use Testo\Bridge\Rector\Set\TestoRectorSetList;

return RectorConfig::configure()
    ->withPaths([__DIR__ . '/tests'])
    ->withSets([TestoRectorSetList::PHPUNIT_TO_TESTO]);
```

```bash
vendor/bin/rector process
```

Rector walks the listed files and rewrites them in place, so it's easy to review the result with a plain `git diff` before committing.

::: info Not everything is convertible
Some constructs can't be converted — they simply have no faithful counterpart in the target framework. The set leaves them as-is rather than dropping them, so you can spot and fix them manually.
:::

::: question What happens to a test that can't be converted?
It depends on what exactly can't be converted. A standalone construct with no counterpart (a mock, a PHPUnit constraint, a Pest `arch()` test) is left in the code as-is — the rest of the test is rewritten and you clean that spot up by hand. When a whole test needs a live Testo runtime (the Testo → PHPUnit direction), it's turned into a visible `markTestSkipped()` with a reason, and the other tests in the class keep running. Either way, nothing is deleted silently.
:::

## Testing your own rules

If you write your own Rector rules, Testo gives you a more convenient toolkit for testing them than the stock one. It has nothing to do with converting tests — it's a standalone tool for rule authors, usable in any project that has Testo.

Testing rules through PHPUnit means a separate `AbstractRectorTestCase` subclass per rule, each with the same data provider and test method. Instead of that boilerplate, a **single attribute right on the rule** is enough: Testo finds its fixtures and turns each into its own data set — the same idea as the <plugin>Inline</plugin> plugin.

On top of that, each fixture's input and expected output are streamed to a messenger channel, so you see the "before → after" of every case right in the report:

![Rector fixtures in messenger channels](/docs/bridge/rector-fixtures-channels.png)

### Setup

The toolkit plugs in as an ordinary suite plugin. Create a suite that scans your rule sources and add <class>\Testo\Bridge\Rector\Testing\RectorTestingPlugin</class> to it:

```php
// suites.php
use Testo\Application\Config\FinderConfig;
use Testo\Application\Config\SuiteConfig;
use Testo\Bridge\Rector\Testing\RectorTestingPlugin;

return [
    new SuiteConfig(
        name: 'Rector',
        location: new FinderConfig(include: [__DIR__ . '/src']),
        plugins: [new RectorTestingPlugin()],
    ),
];
```

The plugin discovers every rule carrying the <attr>\Testo\Bridge\Rector\Testing\TestRectorFixtures</attr> attribute and runs its fixtures.

<signature h="3" name="#[\Testo\Bridge\Rector\Testing\TestRectorFixtures(string ...$paths)]">
<short>Declares the fixtures that exercise a Rector rule.</short>
<description>
Placed on a rule class. Takes one or more paths to fixtures — directories or single files; a directory is scanned for `*.php.inc` fixtures.

The plugin fans the rule out into one data set per fixture, just as a <attr>\Testo\Data\DataProvider</attr> expands a parameterized test.
</description>
<param name="$paths">Paths to directories or files with fixtures — relative (to the rule's file) or absolute, within the project.</param>
<example>
```php
#[TestRectorFixtures('Fixture/AssertCallToTestoRector')]
final class AssertCallToTestoRector extends AbstractRector { /* … */ }
```
</example>
</signature>

### Fixture format

A fixture is a `*.php.inc` file holding the input and the expected output, separated by a `-----` line. If there is no separator, the rule is expected to leave the input **unchanged** — handy for the "must not touch this" cases:

```php
<?php

class SomeTest
{
    public function test()
    {
        $this->markTestIncomplete('todo');
    }
}
-----
<?php

class SomeTest
{
    public function test()
    {
        throw new \Testo\Core\Exception\SkipTest('Incomplete: todo');
    }
}
```

Each fixture runs through a freshly-booted Rector container and is reported as its own data set, so a failing conversion points you straight at the offending file.

::: info Reusable by design
The toolkit ships with the package so downstream rule authors can reuse it — `testo/*` are `require-dev` plus a `suggest`, and the fixtures themselves are `export-ignore`d. If you write Rector rules and use Testo, this harness is available to you out of the box.
:::
