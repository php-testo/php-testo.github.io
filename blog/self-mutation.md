---
title: "Who Mutates the Mutator"
date: 2026-07-01
description: "What happens when mutation testing tries to mutate the very tool it tests with."
author: Aleksei Gagarin
image: /blog/self-mutation/preview.png
---

# Who Mutates the Mutator?

Mutation testing works on a simple idea: the tool makes a small change to your code — a mutant — and checks whether your tests catch it. If a test fails, the mutant is "killed" and your checks are doing their job. If nothing fails, the mutant "survives" — and that means there's a hole somewhere.

All of this rests on one silent assumption: **the observer never changes — only the object does.** The framework stays the same; only the code beneath it breaks — and the difference is plain to see. But what if the framework tests itself? Then the observer becomes part of the observed system, and the assumption falls apart.

## How it breaks in Testo

Run Infection over the <plugin>Filter</plugin> plugin — the one that selects tests by `--path`, `--group`, `--filter`, and so on — and at least one mutant will stubbornly "survive", even though it genuinely breaks the code.

The explanation turned out to be an elegant one. To check a mutant, Infection runs the tests that cover it — and it picks which ones through `--filter`, that is, through the very code that's mutated right now. From there the chain writes itself:

> Mutate the filter → the filter breaks → Testo can't tell which test to run → no test runs at all → nothing to fail → Infection sees "success" → the mutant is marked as survived.

Note: this is **not an equivalent mutant**. An equivalent mutant doesn't change behavior for any input.

In a situation like this, you can't even be sure the killed mutants are being killed for the right reason.

As a fix, I could exclude <plugin>Filter</plugin> from mutation testing — and then every other plugin too, since they all share the problem. No, that's not a fix.

What if I ran the tests on a different framework? I'd still want to keep writing them in Testo, though.

Writing a shim to run Testo tests on PHPUnit is a dead end: PHPUnit isn't up to it. But what if I rewrote the tests from Testo to PHPUnit where possible, and ran Infection + PHPUnit on those?

That leaves "just" one thing: learning to rewrite tests from one framework to another without losing their meaning. For that there's [Rector](https://github.com/rectorphp/rector), which walks the AST and rewrites code according to rules.

::: info
Actually, the whole idea came from [@samdark](https://github.com/samdark): I showed him the [PEST-to-PHPUnit](https://github.com/HelgeSverre/pest-to-phpunit) rule set, he suggested doing the same for Testo → PHPUnit, and I loved it.

You might think I'm playing for the wrong team, but let me remind you: Testo is on the developer's side. I often see people regret picking PEST and wishing they could go back to PHPUnit. The same could happen with Testo — so why not help them do exactly that?
:::

That's how the `testo/bridge-rector` package was born: a set of conversion rules plus the harness to test them.

## The Rector harness

Rector transforms code through rules. But every rule needs to be tested somehow. Rector has its own fixture format for this: `*.php.inc` files holding the "input" and the "expected output", plus <class>\Testo\Bridge\Rector\Testing\Internal\RectorRunner</class> to run them. Handy: one fixture — one self-contained "before → after" case.

Rector's native harness runs on PHPUnit through some scaffolding: for each rule you create a separate test class extending <class>\Rector\Testing\PHPUnit\AbstractRectorTestCase</class>, and inside it always the same thing — a data provider of fixture paths and a cookie-cutter test method.

```php
final class MarkTestIncompleteRectorTest extends AbstractRectorTestCase
{
    #[DataProvider('provideData')]
    public function test(string $filePath): void
    {
        $this->doTestFile($filePath);
    }

    public static function provideData(): Iterator
    {
        return self::yieldFilesFromDirectory(__DIR__ . '/Fixture');
    }
}
```

That's a lot of boilerplate, isn't it? Testo isn't that clunky, so I built myself a nicer harness: a single attribute on the rule itself, pointing at the fixtures folder.

```php
#[TestRectorFixtures('MarkTestIncompleteRector')]
final class MarkTestIncompleteRector extends AbstractRector { /* … */ }
```

It works on the same principle as the <plugin>Inline</plugin> plugin: each <attr>\Testo\Bridge\Rector\Testing\TestRectorFixtures</attr> turns into a Data Provider, and each `*.php.inc` into a Data Set. The input and the expected output are piped into channels. No boilerplate classes, and all the detail right there in front of you.

![Fixture in channels](/blog/self-mutation/img-01.png)

If you write Rector rules and use Testo, this harness is available to you too — just add <class>\Testo\Bridge\Rector\Testing\RectorTestingPlugin</class> to `testo.php`.

## The Rector rules

As long as conversion was "assert here, assert there", everything looked smooth. The real work started where the two frameworks diverge in semantics — and they diverge more often than you'd think.

For example:
- **`$this` in PHPUnit needs a class context.** Static test methods have to be turned into regular ones.
- **You can't use a constructor or destructor in PHPUnit.**
  Fine, they get converted into a `#[Before]`/`#[After]` hook. Not the same thing, but better than nothing.
- **Unfold the chain without shooting yourself in the foot.** Assertions like `Assert::array($log->all())->isList()` expand into several lines in PHPUnit: `assertIsArray($x)` + `assertIsList($x)`. But `$log->all()` mustn't be evaluated twice (what if there's a side effect?), so the subject is hoisted into a local variable. And its name has to be chosen so it doesn't clobber one already in the method — hence the `$value`, `$value2`, `$value3`… generator.
- **In Pest, a test is a call that takes a closure, not an explicit declaration** — and full of magic and `$this` on top of that. You either turn them into functions or write yet another plugin; for now I've settled on functions.

Pest? Well, I just figured… since I was writing Testo → PHPUnit conversion rules anyway, why not make them bidirectional and toss Pest into the mix too? That's how three rule sets were born:
- **testo-to-phpunit**
- **phpunit-to-testo**
- **pest-to-testo**

## Feature parity

Not every feature is translatable — and that's fine:

- **Mocks** (`createMock`, `prophesize`) → Testo has no built-in mocking. The [Mockery-integration issue](https://github.com/php-testo/testo/issues/41) has been open for a while. Any takers for a bridge?
- **Retry** and **Repeat** are planned for PHPUnit 13.3, but aren't there yet.
- **memory-leak** checks exist only in Testo.
- A DataProvider in Testo can be any `callable` — even a non-static method, or a closure right in the attribute. Plus strategies like <attr>\Testo\Data\DataCross</attr> and <attr>\Testo\Data\DataZip</attr>. Converting it is doable, but no longer trivial.
- Inline tests and benchmarks are easier to just bury than to convert.
- Statuses like `Cancelled` and `Aborted` simply don't exist in PHPUnit — you have to reach for the nearest stand-in.
- Running in a separate process isn't supported in Testo.

Such cases aren't dropped silently — they get documented stub rules and an entry in `TODO.md`. In user tests, whatever can't be converted is marked `skipped` with a reason.

## The mirror

Let's come back to the original problem — mutation testing by an outside observer.

Now a single command copies every test (except `Self`/`Inline`/`Bench`) into a temp folder and converts it to PHPUnit. The result is a set of mirror tests that then run against the original code — but this time under Infection + PHPUnit.

> Like nesting dolls: Testo tests the Rector rules that rewrite Testo tests into PHPUnit, so that PHPUnit can test — and Infection can mutate — Testo's own code.

## What came of it

The observer is finally on the outside.

- The mirror builds and stays green: **864 tests, 0 errors or failures**, ~37 skips (couldn't be converted), a single benign-risky.
- The agent skill for PHPUnit → Testo conversion was extended with the Rector scripts.
- Infection now has **two fronts**: Testo and PHPUnit.
- Mutants die reliably.

It's too early to celebrate, though. The `Self` tests don't make it into the mirror, and they cover an order of magnitude more code than ordinary unit tests — so Infection still sees only a small fraction of the mutants. But at least it's something to work with now.
