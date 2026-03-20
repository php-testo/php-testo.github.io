---
outline: [2, 3]
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

Tests are most commonly written in classes and functions, separate from the code being tested, in a `tests/` directory.

A good test follows the AAA pattern — Arrange, Act, Assert:

::: code-group
```php [AAA]
function calculatesOrderTotal(): void
{
    // Arrange
    $order = new Order();
    $order->addItem('Book', price: 15.0, quantity: 2);
    $order->addItem('Pen', price: 3.0, quantity: 5);

    // Act
    $total = $order->total();

    // Assert
    Assert::same($total, 45.0);
}
```
```php [Exception]
function throwsOnNegativeAmount(): never
{
    // Arrange
    $account = new Account(balance: 100);

    // Assert — before action
    Expect::exception(InsufficientFundsException::class);

    // Act
    $account->withdraw(200);
}
```
```php [Simple test]
// For simple tests, AAA is overkill
function defaultCurrencyIsUsd(): void
{
    Assert::same(new Money(100)->currency, 'USD');
}
```
:::

For checks, Testo provides two facades from the [Assert plugin](plugins/assert.md):

- `Assert` — assertions, checked immediately. Supports chained typed checks.
- `Expect` — expectations, checked after the test completes (exceptions, memory leaks).

```php
// Assert — assertions
Assert::same($user->name, 'John');
Assert::true($user->isActive);
Assert::string($email)->contains('@');

// Assert — chained typed checks
Assert::string($response->body)
    ->contains('success')
    ->notContains('error');

// Expect — test behavior expectations
Expect::exception(\RuntimeException::class);
Expect::notLeaks($connection);
```

### Attributes

Instead of base classes or magic methods, Testo bets on attributes.

- The `#[Test]` attribute from the [Test plugin](plugins/test.md) marks methods and functions as separate tests:

    ::: code-group
    ```php [Methods]
    // tests/Unit/Order.php
    final class Order
    {
        #[Test]
        public function createsOrder(): void { /* ... */ }

        #[Test]
        public function calculatesTotal(): void { /* ... */ }
    }
    ```
    ```php [Functions]
    // tests/Unit/order.php
    #[Test]
    function creates_order(): void { /* ... */ }

    #[Test]
    function calculates_total(): void { /* ... */ }
    ```
    :::


- Instead of copying the same test for different data, use `#[DataSet]` and `#[DataProvider]` from the [Data](plugins/data.md) plugin to parameterize a test with different data sets:

    ```php
    #[DataSet([1, 2, 3])]
    #[DataSet([5, 5, 10])]
    public function sum(int $a, int $b, int $expected): void { /* ... */ }
    ```

- Instead of <func>\Testo\Expect::exception()</func> you can use the `#[ExpectException]` attribute, which is slightly more compact and adds clarity:

    ```php
    #[ExpectException(\InsufficientFundsException::class)]
    function throwsOnNegativeAmount(): never
    {
        new Account(balance: 100)->withdraw(200);
    }
    ```

- The `#[Retry]` attribute from the [Retry](plugins/retry.md) plugin restarts a test on failure, marking it as flaky:

    ```php
    #[Retry(maxAttempts: 3)]
    public function flakyExternalService(): void { /* ... */ }
    ```

- Lifecycle hooks from the [Lifecycle](plugins/lifecycle.md) plugin help set up the environment and clean state between tests:
    - `#[BeforeTest]` — runs before each test.
    - `#[AfterTest]` — runs after each test.
    - `#[BeforeClass]` — runs once before all tests in the class.
    - `#[AfterClass]` — runs once after all tests in the class.

::: info
Visit the plugin pages for detailed information about each attribute and other capabilities.
:::

### Naming Conventions

The [Convention plugin](plugins/convention.md) discovers tests by naming patterns — no attributes needed. By default, `*Test` suffix on classes and `test*` prefix on methods:

```php
// tests/Unit/OrderTest.php
final class OrderTest
{
    public function testCreatesOrder(): void { /* ... */ }

    public function testCalculatesTotal(): void { /* ... */ }

    public function testAppliesDiscount(): void { /* ... */ }
}
```

::: info
Convention is not included in the default plugin set — [enable it](configuration.md) if needed.
:::

### Practical tips

- **Name tests like scenarios** — `calculatesDiscountForVipCustomer` is clearer than `testDiscount`. When a test fails, the name is the first thing you'll see.
- **One test — one scenario.** Multiple assertions in a test are fine, but multiple scenarios are not. If a test checks both creation and deletion — split it.
- **Stick to AAA** (Arrange, Act, Assert). The `// Arrange // Act // Assert` comments are not required — just separate blocks with blank lines.

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

- **Unit** — fast isolated tests, can run in parallel.
- **Feature** — require application container, HTTP client, database.
- **Integration** — work with real external services, sequential execution.
- **Sources** — inline tests and benchmarks in application code.

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
