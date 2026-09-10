---
title: "Back to 8.1"
date: 2026-09-10
description: "Testo targets PHP 8.2, but PHPLRT wants to run its tests on 8.1. Instead of rewriting the code for the old version, we downgrade it with Rector for the duration of the test run only."
image: /blog/downgrade/preview.jpg
author: Aleksei Gagarin
---

# Back to 8.1

Last time, [Rector helped me](/blog/self-mutation) rewrite tests between frameworks: Testo → PHPUnit and back, so that mutation testing could finally look at Testo from the outside. The conversion rules live in the [Rector bridge](/docs/bridge/rector.md) and have been quietly doing their job ever since, helping move various projects over to Testo.
This time, though, the task came from a different direction.

It all started at yet another beer meetup, where [Kirill Nesmeyanov](https://github.com/SerafimArts) said he wanted to move his project, [PHPLRT](https://github.com/phplrt/phplrt), to Testo. An Opus 4.8 agent armed with Testo's skills and Rector converted the whole thing in a few minutes.
The monorepo infrastructure [got simpler, the test code got cleaner](https://github.com/phplrt/phplrt/pull/29), and the full test run got half a second faster: 4 -> 3.5 sec. Everyone was happy.

Then came the news: PHPLRT was downgrading from PHP 8.4 to PHP 8.1.
That was a challenge not only for Kirill but [for me](https://github.com/php-testo/testo/issues/322) too: Testo is written for 8.2.


## A One-Version Gap

8.1 and 8.2 really aren't that far apart. But once I walked through the codebase, "it's just `readonly class`" turned into a list:

- **`readonly class`** — Testo has plenty of them, and they are easy to rewrite as regular classes. But `readonly` came with a catch (see below).
- **<func>\ReflectionMethod::hasPrototype()</func>** — the method appeared in 8.2, and Testo uses it to find overridden methods during test discovery. On 8.1 it is an instant fatal error.
- **`memory_reset_peak_usage()`** — also 8.2. Benchmarks use it to reset the memory peak between iterations.
- **`fn(): never => throw ...`** — this one isn't new syntax but a bug in 8.1 itself: `never` can't be declared as the return type even though the body is a `throw` expression. Fixed in 8.2.

I didn't want to rewrite all of this for 8.1. I like the code the way it is: readonly classes, `hasPrototype()` instead of a try/catch around `getPrototype()`. Dragging the whole codebase down for the sake of one version that went out of support about a year ago is a bad trade.

And that's when Rector came to mind again. It has [downgrade sets](https://github.com/rectorphp/rector-downgrade-php) that rewrite new syntax into old. What if we converted Testo to 8.1 **only for the duration of the test run**? The sources stay on 8.2, and in CI the code is run through Rector before the tests start under 8.1.


## The Container First

Before calling in Rector, one landmine had to be cleared.

Testo has its own DI container with scopes: every Test Suite and every test gets a child scope. Some services are **cloned** into the new scope so that one test's state doesn't leak into another, while others, readonly objects among them, are carried over as is, on the assumption that they won't change anyway. So the container looks at the `readonly` flag to decide whether a service is immutable.

Now imagine Rector strips `readonly` from every class. The container stops recognizing shared services and starts cloning them. Nothing might break right away, but the behavior changes. Reports, for instance, would only be collected for a single scope. Bugs like that take a long time to track down.

The right fix is to say it explicitly rather than guess from a modifier. So the container gained the <attr>\Internal\Container\Attribute\ScopeShared</attr> attribute: a class marked with it lives as a single instance across the whole scope tree, readonly or not.

It was also a good moment to move the container into its own package, [internal/container](https://github.com/php-internal/container). Until then it had been copy-pasted across three projects: in Testo, in [Trap](https://github.com/buggregator/trap), and in [DLoad](https://github.com/php-internal/dload). Now all three use the same package ([Trap](https://github.com/buggregator/trap/pull/218), [DLoad](https://github.com/php-internal/dload/pull/116)), and in Testo the readonly services that need it are [marked with the attribute](https://github.com/php-testo/testo/pull/327).

## Now Rector

First I ran the downgrade locally: rewrote the entire codebase to 8.1 and ran the tests on it under 8.1. Rector handled almost everything, and that "almost" was the interesting part:

- The `never` rule didn't know about arrow functions; it only downgraded regular `function(): never`. I sent a [fix](https://github.com/rectorphp/rector-downgrade-php/pull/397), and it was accepted.
- There was no rule for `ReflectionMethod::hasPrototype()` at all. I wrote a [new one](https://github.com/rectorphp/rector-downgrade-php/pull/398): the call is replaced with `try { getPrototype() } catch`. `getPrototype()` has been around forever and throws when there is no prototype.
- `memory_reset_peak_usage()` is a [dead end](https://github.com/rectorphp/rector/issues/9890). A polyfill is impossible: the function has no userland equivalent, only the engine can reset the memory peak. In the end, the call in the benchmarks is wrapped in `function_exists()`, and the one test that compares the peak memory of two algorithms is simply skipped on 8.1: without the reset, its measurement is meaningless.

With these changes, all of Testo converts cleanly to 8.1, and the full test suite passes there. Locally, problem solved.


## What About CI?

This is where the real work begins. In my own CI I can run Rector over the codebase before the tests. But PHPLRT installs Testo through Composer, where it sits in `vendor/` alongside fifty other packages. How do you get it in there already downgraded?

The obvious first idea is `composer install --ignore-platform-req=php`, followed by Rector over the vendor directory. Composer installs everything regardless of the PHP version, and Rector downgrades whatever needs it.

That won't work! Lift the PHP constraint, and Composer grabs the latest versions of every package. On an unconstrained platform that means Symfony 8, which needs PHP 8.4. Rector would certainly try to downgrade it too, but that is a very different amount of code and a very different level of risk. Wherever possible, we want packages that already target 8.1, with no downgrade at all.

So packages fall into two kinds:

- **Compatible** — they have a version for 8.1, just not the latest one. Symfony, PSR packages, almost the entire vendor directory. They don't need downgrading; Composer just needs to be allowed to pick the right version.
- **Conflicting** — there is no 8.1 version at all; the package has targeted 8.2+ from day one. These are the ones to downgrade. In our case that's Testo itself and its plugins.

But how do you tell them apart?
Only Composer can, and only while it is resolving dependencies.


## The Action

That's how the scheme came about. Instead of lifting the PHP constraint, we do the opposite and nail the platform down: `composer config platform.php 8.1`. Now Composer resolves dependencies as if it were already running on 8.1. For compatible packages it picks the newest suitable version on its own: Symfony 6 instead of 8. And it fails **only** on the conflicting ones: "package so-and-so has no version for PHP 8.1".

Those conflicting packages become the downgrade list. From there it's a loop:

1. The conflicting package is copied out of `vendor/` into `.php-downgrade/`.
2. In its `composer.json`, the version is pinned and the PHP constraint is lowered to `>=8.1`.
3. The folder is registered in the root `composer.json` as a local path repository.
4. `composer update` runs again. The pinned platform rejects the original from Packagist, while our copy with the relaxed `require.php` gets through. If another package fails, it also moves to `.php-downgrade/`, and the loop repeats.

Once everything resolves, a single Rector pass over the copied packages brings their code down to 8.1.

This is how the [universal action](https://github.com/php-internal/actions) came to be: `php-internal/actions/downgrade`. You give it a target PHP version, and it installs dependencies at the newest versions that fit that platform, downgrading only what wouldn't install otherwise.

It isn't limited to the vendor directory: the project's own files can be downgraded as well. The `testo.php` config and the tests themselves are written for PHP 8.2, for instance, so it makes sense to bring them down to 8.1 too. Let the tests stay pretty, and let Rector sort it out.


```yaml
- name: Install and downgrade for PHP 8.1
  if: matrix.php == '8.1'
  uses: php-internal/actions/downgrade@v1
  with:
    php-version: '8.1'
    dependency-versions: ${{ matrix.dependencies }}
    paths: tests testo.php

- name: Run Tests
  run: composer test:ci
```
