---
title: "Beta Testing is Open!"
outline: [2, 3]
date: 2026-04-01
description: "Start testing with Testo today and help make it better before the release!"
image: /blog/beta-testo/img-0.jpg
author: Aleksei Gagarin
faqLevel: false
---

# Beta Testing is Open!

Testo is a testing framework for PHP, built from scratch. Not a wrapper, not a fork, not an add-on — a fully independent architecture based on plugins, middlewares, and events.

The result is a flexible tool with a pleasant API and capabilities that go beyond conventional testing — from inline tests right in `src` to benchmarks with a single attribute.

::: question Why another testing framework?
Existing solutions are built on architecture that has evolved over years and carries a lot of legacy. Getting something fundamentally new into them is extremely difficult. Testo started from a clean slate — giving us the freedom to make the right decisions without worrying about backwards compatibility.
:::

::: question What is Testo's philosophy?
Give the developer full control without imposing anything.
Testo doesn't dictate how to write tests. It provides tools and extension mechanisms, and you decide how to use them. Everything you don't need can be disabled. Everything that's missing can be added.

Testo is built on respect.
- PHP 8.2+ — the widest version support among testing frameworks. If your project can't jump to the latest PHP, that's no reason to go without updates and security fixes.
- A new PHP release doesn't mean a new major framework release.
- No <abbr title="Closing issues without resolution just to zero out the counter.">Zero Issues</abbr> policy — Testo aims to solve problems, not sweep them under the rug.
:::

::: question How is Testo different from PHPUnit and Pest?
**Extensibility.**
Inline tests, benchmarks, retry — these are all regular plugins built on the same mechanisms available to you. Writing your own plugin takes a couple dozen lines of code. Want to create a custom attribute with cool logic? Easy — <attr>\Testo\Retry</attr> is a great example.

**Flexibility.**
You can shape Testo into exactly what you need. Everything you don't need can be disabled. Each Test Suite can have its own set of plugins.
:::

::: question Can I use Testo alongside other testing frameworks?
Yes. Testo is fully independent and doesn't conflict with other tools — it doesn't even patch `nikic/php-parser` or [use it](https://github.com/sebastianbergmann/phpunit/issues/6381). You can install Testo alongside Codeception, PHPUnit, or Pest and start writing new tests with Testo without touching the existing ones.
:::

::: question Does Testo work with AI agents?
Yes. Testo provides `llms.txt` and `llms-full.txt` — special files for AI agents describing the framework's API. Feed them to your agent, and it will start writing Testo tests right away. Learn more in the [documentation](/docs/ai-agents.md).
:::

::: question Is there IDE support?
PHPStorm has a full-featured [plugin](https://plugins.jetbrains.com/plugin/28842-testo) — test execution, navigation, and results displayed right in the IDE.
:::

::: question How ready is Testo for use?
Beta testing is underway. The public API has stabilized, documentation is being written, and the PHPStorm plugin works. Before the release, we still need to refine reports, add parallel execution, and a few other things.
:::

::: question Is it hard to switch from PHPUnit?
Testo uses familiar PHP and OOP syntax: no DSL, no magic methods, no unusual constructs. **If you write PHP, you already know Testo's syntax.** It's not a drop-in replacement for PHPUnit yet, but the learning curve is minimal.

A word about assertions. The xUnit family (PHPUnit, JUnit, NUnit) historically uses `$expected, $actual` argument order — an endless source of confusion.
- `webmozart/assert` solved this simply: put `$actual` first.
- Pest chose a fluent API like Jest: `expect($actual)->not()->toBe($expected)`, but at the cost of a magic DSL, atypical for PHP.
- Testo took the best of both approaches: intuitive argument order and typed chains that also streamlined the main facade. For example: `Assert::string($email)->contains('@')`. No magic, full IDE and static analysis support.
:::

## Installation and Setup

Just 3 steps:

1. Install Testo via Composer:
    ```bash
    composer require --dev testo/testo
    ```

2. Create `testo.php` in the project root:

    ```php
    <?php

    declare(strict_types=1);

    use Testo\Application\Config\ApplicationConfig;
    use Testo\Application\Config\SuiteConfig;

    return new ApplicationConfig(
        suites: [
            new SuiteConfig(
                name: 'Sources',
                location: ['src'],
            ),
            new SuiteConfig(
                name: 'Tests',
                location: ['tests'],
            ),
        ],
    );
    ```

    ::: question What is this file?
    Testo is configured with a PHP file that returns an <class>\Testo\Application\Config\ApplicationConfig</class> object.
    If the file doesn't exist, Testo will try to run tests from the `tests` folder with default settings.

   Here we defined two test suites:
   - `Sources` for inline tests and benchmarks right in the project code, in the `src` folder;
   - `Tests` for regular unit tests in the `tests` folder.
    :::

3. Install the PHPStorm plugin:

    <JetBrainsPlugin />

Run tests directly from PHPStorm using the plugin, or via CLI:

```bash
./vendor/bin/testo
```

## First Tests

### Unit Test

A test is a regular class with methods marked by the <attr>\Testo\Test</attr> attribute. No base class inheritance:

```php
final class OrderTest
{
    #[Test]
    public function calculatesTotal(): void
    {
        $order = new Order();
        $order->addItem('Book', price: 15.0, quantity: 2);
        $order->addItem('Pen', price: 3.0, quantity: 5);

        Assert::same($order->total(), 45.0);
    }

    #[Test]
    #[DataSet([100.0, 10, 90.0], '10% off')]
    #[DataSet([100.0, 0, 100.0], 'no discount')]
    #[DataSet([0.0, 50, 0.0], 'zero price')]
    public function appliesDiscount(float $price, int $percent, float $expected): void
    {
        $result = Order::applyDiscount($price, $percent);

        Assert::same($result, $expected);
    }

    #[Test]
    #[ExpectException(InsufficientFundsException::class)]
    public function cannotOverdraw(): never
    {
        new Account(balance: 100)->withdraw(200);
    }
}
```

Here's what typed assertion chains look like:

```php
Assert::string($email)->contains('@');

Assert::int($age)->greaterThan(0)->lessThan(150);

Assert::array($items)
    ->hasKeys('id', 'name')
    ->isList()
    ->notEmpty();

Assert::json($response->body())
    ->isObject()
    ->hasKeys('data', 'meta');

Expect::exception(PaymentException::class)
    ->fromMethod(PaymentGateway::class, 'charge')
    ->withMessageContaining('insufficient funds')
    ->withCode(402);
```

### Inline Tests

Test your methods right where they're declared. No separate test file needed. The <attr>\Testo\Inline\TestInline</attr> attribute runs the method with given arguments and checks the result. Works even with private methods:

```php
// src/Money.php
final class Money
{
    #[TestInline(['price' => 100.0, 'discount' => 0.1, 'tax' => 0.2], 108.0)]
    #[TestInline(['price' => 50.0, 'discount' => 0.0, 'tax' => 0.1], 55.0)]
    private static function calculateFinalPrice(
        float $price,
        float $discount,
        float $tax,
    ): float {
        return $price * (1 - $discount) * (1 + $tax);
    }
}
```

Perfect for pure functions and rapid prototyping. The test lives next to the code and gets updated along with it.

### Benchmarks

Instantly compare function performance without any boilerplate: just add the <attr>\Testo\Bench</attr> attribute to a function and you're good to go:

```php
#[Bench(
    callables: [
        'multiply' => 'viaMultiply',
        'shift'    => 'viaShift',
    ],
    arguments: [1, 5_000],
    calls: 2_000_000,
)]
function viaDivision(int $a, int $b): int
{
    $d = $b - $a + 1;
    return (int) (($d - 1) * $d / 2) + $a * $d;
}

function viaMultiply(int $a, int $b): int
{
    $d = $b - $a + 1;
    return (int) (($d - 1) * $d * 0.5) + $a * $d;
}

function viaShift(int $a, int $b): int
{
    $d = $b - $a + 1;
    return ((($d - 1) * $d) >> 1) + $a * $d;
}
```

```
+---+----------+-------+---------+------------------+--------+
| # | Name     | Iters | Calls   | Avg Time         | RStDev |
+---+----------+-------+---------+------------------+--------+
| 2 | current  | 10    | 2000000 | 75.890µs         | ±0.79% |
| 3 | multiply | 10    | 2000000 | 78.821µs (+3.9%) | ±0.47% |
| 1 | shift    | 10    | 2000000 | 70.559µs (-7.0%) | ±0.70% |
+---+----------+-------+---------+------------------+--------+
```

## Interested?

If Testo caught your attention and you'd like to learn more, check out these articles:

- ["To the Collider!"](./collider.md) — about benchmarks and performance comparison.
- ["Testo. Assert and Expect"](./assert-and-expect.md) — about the new and legacy API for assertions and expectations.
- ["Data Providers"](./data-providers.md) — about powerful and flexible data providers for tests.

Give a star on [GitHub](https://github.com/php-testo/testo) and rate the [PHPStorm plugin](https://plugins.jetbrains.com/plugin/28842-testo). It really helps Testo gain visibility.

## What's Next?

Beta testing is underway and we're moving toward the release.
The public API has stabilized, but there are still a few things to finish:

- Refine CLI and PHPStorm report output, add diff.
- Small things like STDOUT capture and PHP error handling.
- Parallel test execution and isolated execution in a separate process.
- Fine-tune minor things in benchmarks and internals.
- Organizational matters like splitting the monorepo and finishing the documentation.

Code coverage and mocks might also make it to the release, but no promises.

You can help by testing and providing feedback to make the release as smooth as possible.
Head to [GitHub Issues](https://github.com/php-testo/testo/issues) with ideas, questions, and problems. Let's figure it out together!
