---
llms_description: "Test approaches: separate tests in classes/functions (#[Test], conventions), inline tests (#[TestInline]), benchmarks (#[Bench]), folder structure, suite configuration"
---

# Writing Tests

Testo doesn't dictate how or where to write tests. Separate tests in classes and functions, inline tests on production code, benchmarks — all approaches can be combined in one project.

**Test Approaches**

| Approach                          | Discovery               | When to use                       |
|-----------------------------------|-------------------------|-----------------------------------|
| [Separate tests](#separate-tests) | `#[Test]` / conventions | Unit, feature, integration        |
| [Inline tests](#inline-tests)     | `#[TestInline]`         | Simple checks in application code |
| [Benchmarks](#benchmarks)         | `#[Bench]`              | Performance comparison            |

## Separate Tests

Tests in dedicated classes and functions — the main approach. Test code lives separately from production code, usually in a `tests/` directory.

Tests are written in class methods or functions. Testo discovers them via the [Test plugin](plugins/test.md) (`#[Test]` attribute) or the [Convention plugin](plugins/convention.md) (by naming). Convention is not included in the default plugin set — [enable it](configuration.md) if needed.

::: code-group
```php [#[Test] on class]
// tests/Unit/Order.php
#[Test]
final class Order
{
    public function createsOrder(): void { /* ... */ }

    public function calculatesTotal(): void { /* ... */ }
}
```
```php [#[Test] on method]
// tests/Unit/Order.php
final class Order
{
    #[Test]
    public function createsOrder(): void { /* ... */ }

    #[Test]
    public function calculatesTotal(): void { /* ... */ }
}
```
```php [Conventions]
// tests/Unit/OrderTest.php
final class OrderTest
{
    public function testCreatesOrder(): void { /* ... */ }

    public function testCalculatesTotal(): void { /* ... */ }

    public function testAppliesDiscount(): void { /* ... */ }
}
```
```php [Function]
// tests/Unit/order.php
#[Test]
function creates_order(): void { /* ... */ }

#[Test]
function calculates_total(): void { /* ... */ }

#[Test]
function applies_discount(): void { /* ... */ }
```
:::

### More expressive with attributes

Attributes remove boilerplate and make tests easier to read. Instead of copying a test for each data set — [data providers](plugins/data.md). Instead of `try/catch` — `#[ExpectException]`. Instead of manual retry — [`#[Retry]`](plugins/retry.md):

```php
#[Test]
#[DataSet([1, 2, 3])]
#[DataSet([5, 5, 10])]
public function sum(int $a, int $b, int $expected): void { /* ... */ }

#[Test]
#[ExpectException(\RuntimeException::class)]
public function throwsOnInvalidInput(): never
{
    throw new \RuntimeException('Invalid input');
}

#[Test]
#[Retry(maxAttempts: 3)]
public function flakyExternalService(): void { /* ... */ }
```

The [Lifecycle plugin](plugins/lifecycle.md) is also useful — it adds `#[BeforeEach]`, `#[AfterEach]`, `#[BeforeAll]`, `#[AfterAll]` hooks for setting up the environment and cleaning state between tests.

## Inline Tests

Tests directly on the method being tested using the `#[TestInline]` attribute from the [Inline plugin](plugins/inline.md) — even a separate test class is not needed:

```php
#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
public static function sum(int $a, int $b): int
{
    return $a + $b;
}
```

Each attribute runs the method with the given arguments and checks the result. Works even with private methods.

Best for simple pure functions and quick prototyping.

## Benchmarks

The `#[Bench]` attribute from the [Bench plugin](plugins/bench.md) compares function performance:

```php
#[Bench(
    callables: [
        'array' => [self::class, 'sumInArray'],
    ],
    arguments: [1, 5_000],
    calls: 2000,
    iterations: 10,
)]
public static function sumInCycle(int $a, int $b): int
{
    $result = 0;
    for ($i = $a; $i <= $b; ++$i) {
        $result += $i;
    }
    return $result;
}
```

Testo runs functions the specified number of times, filters outliers, and provides statistics with recommendations.


## Folder Structure

Recommended structure, suitable for most applications:

```
project/
├── src/                  ← inline tests, benchmarks
│   └── ...
└── tests/
    ├── Unit/
    │   └── ...
    ├── Feature/
    │   └── ...
    └── Integration/
        └── ...
```

Each Suite is not just a separate folder, but a separate [SuiteConfig](configuration.md#suiteconfig) with its own set of plugins. For example:

- **Unit** — fast isolated tests, can run in parallel
- **Feature** — require application container, HTTP client, database
- **Integration** — work with real external services, sequential execution
- **Sources** — inline tests and benchmarks in application code

```php
return new ApplicationConfig(
    suites: [
        new SuiteConfig(name: 'Unit', location: ['tests/Unit'], plugins: [/* ... */]),
        new SuiteConfig(name: 'Feature', location: ['tests/Feature'], plugins: [/* ... */]),
        new SuiteConfig(name: 'Integration', location: ['tests/Integration'], plugins: [/* ... */]),
        new SuiteConfig(name: 'Sources', location: ['src'], plugins: [/* ... */]),
    ],
);
```

In modular architecture, tests can live within modules, with configs combined into one, as in a [monorepo](configuration.md#monorepo).
