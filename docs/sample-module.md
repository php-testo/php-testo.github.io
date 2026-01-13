# Sample Module

The Sample module provides attributes for parameterized testing - running the same test logic with different input data. Think of it as a way to test your functions against multiple scenarios without writing repetitive test code.

Currently includes:
- **DataProvider** - for dynamic, complex data sets
- **[TestInline](./inline-tests)** - for simple, static test cases right on the method

## Data Provider

`DataProvider` lets you specify a method or callable that returns test data. Each data set from the provider runs as a separate test:

```php
use Testo\Attribute\Test;
use Testo\Sample\DataProvider;

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

### Labels and Descriptions

Each data set can be labeled with a string key. These labels appear in test reports, making it easier to identify which scenario failed:

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

Use `DataProvider` when:
- You have many test cases (10+)
- Data is generated dynamically or loaded from external files
- Test cases need labels or descriptions for clarity
- You need complex setup logic for test data

**Note:** `DataProvider` is an addition to regular tests (methods marked with `#[Test]`). It provides data to existing test methods.