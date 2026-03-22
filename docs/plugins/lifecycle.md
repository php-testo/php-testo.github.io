---
llms_description: "#[BeforeTest], #[AfterTest], #[BeforeClass], #[AfterClass] lifecycle hooks, execution order, priority, class instantiation behavior"
---

# Lifecycle

Lifecycle attributes let you run code before and after tests — for setting up the environment, cleaning up state, and managing resources.

<plugin-info class="\Testo\Lifecycle\LifecyclePlugin" name="Lifecycle" included="\Testo\Application\Config\Plugin\SuitePlugins" />

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

<signature h="3" compact name="#[\Testo\Lifecycle\BeforeTest(int $priority = 0)]">
<short>Runs a method before each test in the class.</short>
<param name="$priority">Execution priority. Higher values run first.</param>
</signature>

<signature h="3" compact name="#[\Testo\Lifecycle\AfterTest(int $priority = 0)]">
<short>Runs a method after each test in the class.</short>
<param name="$priority">Execution priority. Higher values run first.</param>
</signature>

<signature h="3" compact name="#[\Testo\Lifecycle\BeforeClass(int $priority = 0)]">
<short>Runs a method once before all tests in the class. Suitable for expensive setup.</short>
<param name="$priority">Execution priority. Higher values run first.</param>
</signature>

<signature h="3" compact name="#[\Testo\Lifecycle\AfterClass(int $priority = 0)]">
<short>Runs a method once after all tests in the class. Suitable for cleanup.</short>
<param name="$priority">Execution priority. Higher values run first.</param>
</signature>

## Execution Order

```
BeforeClass (once)
├── BeforeTest
│   └── Test 1
│   └── AfterTest
├── BeforeTest
│   └── Test 2
│   └── AfterTest
└── ...
AfterClass (once)
```

## Basic Example

```php
final class DatabaseTest
{
    private static Connection $connection;
    private Transaction $transaction;

    #[BeforeClass]
    public static function connect(): void
    {
        self::$connection = new Connection();
    }

    #[AfterClass]
    public static function disconnect(): void
    {
        self::$connection->close();
    }

    #[BeforeTest]
    public function beginTransaction(): void
    {
        $this->transaction = self::$connection->beginTransaction();
    }

    #[AfterTest]
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
#[BeforeTest(priority: 100)]
public function initializeConfig(): void
{
    // Runs first (highest priority)
}

#[BeforeTest(priority: 50)]
public function initializeLogger(): void
{
    // Runs second
}

#[BeforeTest] // priority: 0 (default)
public function initializeService(): void
{
    // Runs last
}
```

Higher values execute first. Default priority is `0`.
