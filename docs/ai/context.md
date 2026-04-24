---
llms: "inline"
llms_description: "Testo framework overview for AI agents: architecture, key concepts, and mental model"
---

# Testo — AI Context

Testo is an extensible PHP testing framework built on a minimal core + plugin architecture. This page gives AI agents the mental model needed to generate and reason about Testo tests.

## Key Concepts

### No TestCase Inheritance

Test classes in Testo do **not** extend any base class. Any PHP class (or even a standalone function) can be a test.

```php
<?php

use Testo\Assert;

#[\Testo\Test]
final class OrderTest
{
    public function calculatesTotal(): void
    {
        $order = new Order();
        $order->addItem('Book', price: 15.0, quantity: 2);
        Assert::same(30.0, $order->total());
    }
}
```

### Three Test Discovery Methods

| Method | Attribute | Typical location |
|---|---|---|
| Separate tests | `#[\Testo\Test]` on class/method/function | `tests/` directory |
| Inline tests | `#[\Testo\Inline\TestInline]` | Inside production classes |
| Benchmarks | `#[\Testo\Bench]` | `tests/Bench/` directory |

### Class Instantiation

Testo creates **one instance per test class**, not one per test method. The constructor is called lazily before the first non-static method. Use the constructor for shared, expensive setup (e.g. database connections).

### Test Suite Hierarchy

```
Application
└── Test Suite (Unit, Feature, …)  ← SuiteConfig in testo.php
    └── Test Case (OrderTest, UserTest, …)  ← a class or file
        └── Test (calculatesTotal, …)  ← a method or function
```

## Architecture

Testo is a **small core + plugin system**. Every feature (attributes, data providers, CLI output, assertions, …) lives in a plugin. Plugins register **middleware** into pipelines and/or listen to **PSR-14 events**.

The three main pipelines:

- `TestSuitePipeline` — wraps a Test Suite run
- `TestCasePipeline` — wraps a Test Case (class) run
- `TestPipeline` — wraps a single test method call

Interceptors in each pipeline receive a `$handler` callable and call `$handler($payload)` to continue the chain, just like PSR-15 middleware.

## Assertions

Two facades, used directly (no `$this->assert…`):

- `\Testo\Assert` — immediate assertions. Throw on failure.
- `\Testo\Expect` — deferred expectations. Verified after the test body returns.

```php
use Testo\Assert;
use Testo\Expect;

// Immediate
Assert::same('admin', $user->role);
Assert::true($user->isActive());
Assert::string($name)->notEmpty();

// Deferred (checked after test body)
Expect::exception(\RuntimeException::class)
    ->fromMethod($service, 'process')
    ->withMessage('Something went wrong');
```

## Configuration File (`testo.php`)

```php
<?php

declare(strict_types=1);

use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(name: 'Unit', location: ['tests/Unit']),
        new SuiteConfig(name: 'Feature', location: ['tests/Feature']),
    ],
);
```

## Common Attributes Quick Reference

| Attribute | Purpose |
|---|---|
| `#[\Testo\Test]` | Mark class / method / function as a test |
| `#[\Testo\Data\DataSet([…])]` | Inline parameterized data |
| `#[\Testo\Data\DataProvider('method')]` | Data from a callable |
| `#[\Testo\Lifecycle\BeforeTest]` | Run before each test method |
| `#[\Testo\Lifecycle\AfterTest]` | Run after each test method |
| `#[\Testo\Lifecycle\BeforeClass]` | Run once before all tests in a class |
| `#[\Testo\Lifecycle\AfterClass]` | Run once after all tests in a class |
| `#[\Testo\Retry(3)]` | Retry a flaky test up to N times |
| `#[\Testo\Bench]` | Benchmark (returns time stats, not pass/fail) |
| `#[\Testo\Inline\TestInline]` | Inline test on a production method |

## Running Tests

```bash
# All suites
./vendor/bin/testo

# Specific suite
./vendor/bin/testo --suite Unit

# Specific file or class
./vendor/bin/testo --filter OrderTest
```
