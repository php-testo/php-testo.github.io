# Lifecycle

Lifecycle attributes define setup and teardown methods that run automatically at specific points during test execution.

## Class Instantiation

By default, Testo instantiates each test class **once per test case**, not per test. This means:

- Instance properties persist between tests in the same class
- Constructor runs lazily — right before the first non-static method call
- If all methods are static, the class is never instantiated

```php
final class ServiceTest
{
    private Client $client;
    private int $counter = 0;

    public function __construct()
    {
        // Runs once — natural place for expensive initialization
        $this->client = new Client();
    }

    #[Test]
    public function firstTest(): void
    {
        $this->counter++;
        // $this->counter is now 1
    }

    #[Test]
    public function secondTest(): void
    {
        $this->counter++;
        // $this->counter is now 2 — state persists between tests
        // $this->client is still the same instance
    }
}
```

To control state between tests, use lifecycle attributes described below.

## Attributes

| Attribute | When it runs | How often |
|-----------|--------------|-----------|
| `#[BeforeEach]` | Before each test method | Once per test |
| `#[AfterEach]` | After each test method | Once per test |
| `#[BeforeAll]` | Before all tests in the class | Once per test case |
| `#[AfterAll]` | After all tests in the class | Once per test case |

## Execution Order

```
BeforeAll (once)
├── BeforeEach
│   └── Test 1
│   └── AfterEach
├── BeforeEach
│   └── Test 2
│   └── AfterEach
└── ...
AfterAll (once)
```

## Basic Example

```php
use Testo\Attribute\Test;
use Testo\Attribute\BeforeEach;
use Testo\Attribute\AfterEach;
use Testo\Attribute\BeforeAll;
use Testo\Attribute\AfterAll;

final class DatabaseTest
{
    private static Connection $connection;
    private Transaction $transaction;

    #[BeforeAll]
    public static function connect(): void
    {
        self::$connection = new Connection();
    }

    #[AfterAll]
    public static function disconnect(): void
    {
        self::$connection->close();
    }

    #[BeforeEach]
    public function beginTransaction(): void
    {
        $this->transaction = self::$connection->beginTransaction();
    }

    #[AfterEach]
    public function rollback(): void
    {
        $this->transaction->rollback();
    }

    #[Test]
    public function insertsRecord(): void
    {
        self::$connection->insert('users', ['name' => 'John']);
        Assert::same(1, self::$connection->count('users'));
    }
}
```

## Priority

When you have multiple methods with the same lifecycle attribute, use `priority` to control execution order:

```php
#[BeforeEach(priority: 100)]
public function initializeConfig(): void
{
    // Runs first (highest priority)
}

#[BeforeEach(priority: 50)]
public function initializeLogger(): void
{
    // Runs second
}

#[BeforeEach] // priority: 0 (default)
public function initializeService(): void
{
    // Runs last
}
```

Higher values execute first. Default priority is `0`.

## Error Handling

- Exception in `BeforeEach` — test is aborted
- Exception in `AfterEach` — captured, but test result is preserved
- Exception in `BeforeAll` — all tests in the class are aborted
- Exception in `AfterAll` — captured after all tests complete
