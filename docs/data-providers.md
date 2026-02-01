# Data Providers

Data providers let you run one test with different sets of input data. Each set runs as a separate test.

## DataSet

The simplest way — specify data directly above the method:

```php
#[Test]
#[DataSet([1, 1, 2])]
#[DataSet([2, 3, 5])]
#[DataSet([0, 0, 0])]
public function testSum(int $a, int $b, int $expected): void
{
    Assert::same($expected, $a + $b);
}
```

Each `DataSet` is an array of arguments passed to the test method. The test runs three times with different values.

### Dataset Labels

The second argument is an optional label. It appears in reports and helps identify which scenario failed:

```php
#[DataSet([1, 1, 2], 'positive numbers')]
#[DataSet([-1, -1, -2], 'negative numbers')]
#[DataSet([0, 0, 0], 'zeros')]
public function testSum(int $a, int $b, int $expected): void { ... }
```

## DataProvider

For large amounts of data or dynamic generation, use `DataProvider`. It accepts a method or callable that returns test data:

```php
#[Test]
#[DataProvider('userDataProvider')]
public function testUserValidation(string $email, bool $expected): void
{
    $isValid = $this->validator->validate($email);
    Assert::same($expected, $isValid);
}

public function userDataProvider(): iterable
{
    yield ['valid@example.com', true];
    yield ['invalid', false];
    yield ['test@domain.co.uk', true];
    // ... 50 more cases
}
```

### Flexible Provider Sources

`DataProvider` accepts various callable types:

**Method name from the same class:**
```php
#[DataProvider('dataProvider')]
public function testSomething($data): void { ... }
```

**Method from another class:**
```php
#[DataProvider([DataSets::class, 'userScenarios'])]
public function testUser($data): void { ... }
```

**Closure directly in attribute (PHP 8.5+):**
```php
#[DataProvider(fn() => [
    [1, 2, 3],
    [5, 5, 10],
])]
public function testAddition(int $a, int $b, int $expected): void { ... }
```

**Invokable object:**
```php
#[DataProvider(new UserDataProvider())]
public function testUser($data): void { ... }
```

Invokable objects are particularly useful for separating data loading logic. For example, loading test cases from JSON/CSV files into a dedicated class keeps your test code clean.

### Dataset Labels

Labels are set via string array keys:

```php
public function userDataProvider(): array
{
    return [
        'valid email' => ['test@example.com', true],
        'invalid format' => ['not-an-email', false],
        'empty string' => ['', false],
    ];
}
```