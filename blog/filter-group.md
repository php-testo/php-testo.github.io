---
title: "Grouping tests: the #[Group] attribute"
date: 2026-06-26
description: "The new #[Group] attribute in Testo: tag tests with plain string labels, inherit groups from parent classes, and run the categories you need with --group."
image: /blog/filter-group/preview.png
author: Aleksei Gagarin
---

# Grouping tests with #[Group]

Last week I was building a new component for Cycle ORM — [cycle/transaction](https://github.com/cycle/transaction). Naturally, I wrote its tests with Testo — and I immediately wanted to reproduce the approach I was used to in Cycle: run the same set of tests against every supported database. And that's when it turned out Testo was missing one thing I needed.

## How tests are written in Cycle

Cycle's tests run on PHPUnit, and for the ones that hit real databases a handy convention has emerged:

- You write an abstract class with the tests;
- Then, for each driver, a final class extends it and wires up the concrete driver;
- The groups go on the final classes:

    ```php
    /**
     * @group driver
     * @group driver-mysql
     */
    ```

    Here `driver` means the test talks to a database directly, while `driver-mysql` narrows it down to the concrete driver. The benefit is obvious: you can run tests on SQLite alone, or on any other driver of your choice. That's exactly how they're invoked in CI — a separate run for each database.

## Groups in Testo

Testo didn't have test grouping yet — so it was time to add it. The whole thing took a few hours, including testing hypotheses and the final polish: the feature fit neatly into the <plugin>Filter</plugin> plugin.

Early on I noticed one detail: the `driver` group in my tests could be moved up to the parent class instead of being duplicated in every child. So I added group inheritance right away.

Groups here are plain string labels you attach with the <attr>\Testo\Filter\Group</attr> attribute. The same scenario with an abstract class and drivers now looks like this:

```php
#[Group('driver')]
abstract class TransactionTestCase
{
    public function commitsTransaction(): void { /* ... */ }
}

#[Test]
#[Group('driver-mysql')]
final class MySqlTransactionTest extends TransactionTestCase {}

#[Test]
#[Group('driver-sqlite')]
final class SqliteTransactionTest extends TransactionTestCase {}
```

You pick groups at launch with the `--group` flag:

```bash
# SQLite tests only
testo run --group=driver-sqlite

# All tests that hit a database directly
testo run --group=driver

# Everything except the slow ones
testo run --group=!slow
```

## An unexpected twist

Honestly, I considered test grouping a routine feature and didn't make much of it — I wasn't even going to write a separate post. But today I sat down to read the feedback from the [beta launch](/blog/beta-testo.md) and stumbled on the fact that group inheritance had been requested in PHPUnit as far back as 2019 — only to be turned down:

> I am sorry to say this, but me this does not sound useful.
> [Inherit groups from parent classes #3935](https://github.com/sebastianbergmann/phpunit/issues/3935)

Funnily enough, this exact feature came in handy the very first time I used the <attr>\Testo\Filter\Group</attr> attribute.

---

So here I am, reminding you of one simple thing: Testo is built around what developers actually need.

If an existing tool doesn't solve the community's problems, a new one is only a matter of time. That's how Testo came to be.

Bring your [ideas and needs](https://github.com/php-testo/testo/issues?q=sort%3Aupdated-desc+is%3Aissue+state%3Aopen) to Testo — they stand every chance of getting built. And even if you don't use it, keep this in mind: features from Testo trickle into PHPUnit too, just with a delay.
