---
llms: true
llms_description: "Complete working examples of Testo tests covering common patterns"
---

# Testo — Code Samples

Complete, working examples of Testo tests covering the most common patterns.

## Basic Test Class

```php
<?php

declare(strict_types=1);

use Testo\Assert;

#[\Testo\Test]
final class OrderTest
{
    public function createsEmptyOrder(): void
    {
        $order = new Order();
        Assert::same(0.0, $order->total());
        Assert::true($order->isEmpty());
    }

    public function calculatesTotal(): void
    {
        $order = new Order();
        $order->addItem('Book', price: 15.0, quantity: 2);
        $order->addItem('Pen', price: 2.5, quantity: 3);
        Assert::same(37.5, $order->total());
    }
}
```

## Standalone Test Functions

```php
<?php

declare(strict_types=1);

use Testo\Assert;

#[\Testo\Test]
function validates_email(): void
{
    Assert::true(isValidEmail('user@example.com'));
    Assert::false(isValidEmail('not-an-email'));
}

#[\Testo\Test]
function rejects_empty_email(): void
{
    Assert::false(isValidEmail(''));
}
```

## Parameterized Tests — `#[DataSet]`

```php
<?php

declare(strict_types=1);

use Testo\Assert;

#[\Testo\Test]
final class MathTest
{
    #[\Testo\Data\DataSet([1, 1, 2])]
    #[\Testo\Data\DataSet([2, 3, 5], 'positive numbers')]
    #[\Testo\Data\DataSet([-1, -1, -2], 'negative numbers')]
    #[\Testo\Data\DataSet([0, 0, 0], 'zeros')]
    public function addsNumbers(int $a, int $b, int $expected): void
    {
        Assert::same($expected, $a + $b);
    }
}
```

## Parameterized Tests — `#[DataProvider]`

```php
<?php

declare(strict_types=1);

use Testo\Assert;

#[\Testo\Test]
final class UserValidationTest
{
    #[\Testo\Data\DataProvider('emailCases')]
    public function validatesEmail(string $email, bool $expected): void
    {
        Assert::same($expected, isValidEmail($email));
    }

    public function emailCases(): iterable
    {
        yield 'valid' => ['user@example.com', true];
        yield 'no domain' => ['user@', false];
        yield 'empty' => ['', false];
    }
}
```

## Lifecycle Hooks

```php
<?php

declare(strict_types=1);

use Testo\Assert;

#[\Testo\Test]
final class DatabaseTest
{
    private \PDO $pdo;

    private static \PDO $sharedPdo;

    #[\Testo\Lifecycle\BeforeClass]
    public static function createSchema(): void
    {
        // Runs once before all tests in this class — store shared state in a static property
        self::$sharedPdo = new \PDO('sqlite::memory:');
        self::$sharedPdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    }

    #[\Testo\Lifecycle\BeforeTest]
    public function setUp(): void
    {
        // Runs before each test — set up a fresh per-test state
        $this->pdo = new \PDO('sqlite::memory:');
        $this->pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)');
    }

    #[\Testo\Lifecycle\AfterTest]
    public function tearDown(): void
    {
        // Runs after each test
        $this->pdo->exec('DELETE FROM users');
    }

    public function insertsUser(): void
    {
        $this->pdo->exec("INSERT INTO users (name) VALUES ('Alice')");
        $count = $this->pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        Assert::same('1', $count);
    }
}
```

## Assert vs Expect

```php
<?php

declare(strict_types=1);

use Testo\Assert;
use Testo\Expect;

#[\Testo\Test]
final class ServiceTest
{
    // Assert — immediate, throws on failure
    public function checksString(): void
    {
        $result = strtoupper('hello');
        Assert::same('HELLO', $result);
        Assert::string($result)->notEmpty()->contains('HELLO');
    }

    // Expect — deferred, verified after test body returns
    public function expectsException(): void
    {
        Expect::exception(\InvalidArgumentException::class)
            ->fromCallable(fn() => divide(10, 0))
            ->withMessage('Division by zero');
    }
}
```

## Retry (Flaky Tests)

```php
<?php

declare(strict_types=1);

use Testo\Assert;

#[\Testo\Test]
final class NetworkTest
{
    #[\Testo\Retry(maxAttempts: 3)]
    public function fetchesExternalApi(): void
    {
        $response = (new HttpClient())->get('https://api.example.com/ping');
        Assert::same(200, $response->statusCode());
    }
}
```

## Inline Tests (on Production Code)

```php
<?php

declare(strict_types=1);

use Testo\Assert;

final class StringHelper
{
    #[\Testo\Inline\TestInline]
    public static function slugify(string $text): string
    {
        \Testo\Assert::same('hello-world', self::slugify('Hello World'));
        \Testo\Assert::same('foo-bar-baz', self::slugify('Foo Bar Baz'));

        return strtolower(preg_replace('/\s+/', '-', trim($text)));
    }
}
```

## Benchmark

```php
<?php

declare(strict_types=1);

#[\Testo\Test]
final class SortBench
{
    private array $data;

    public function __construct()
    {
        $this->data = range(1, 10_000);
        shuffle($this->data);
    }

    #[\Testo\Bench]
    public function nativeSort(): void
    {
        $data = $this->data;
        sort($data);
    }

    #[\Testo\Bench]
    public function usort(): void
    {
        $data = $this->data;
        usort($data, fn($a, $b) => $a <=> $b);
    }
}
```
