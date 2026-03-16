---
llms_description: "Parameterized tests: #[DataSet], #[DataProvider] with callables, DataZip (pairing), DataCross (cartesian product), DataUnion (merging), nested combinations"
---

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

## DataZip

Pairs up multiple providers element by element. The first item from the first provider joins with the first item from the second, second with second, and so on.

Typical use case — testing related data where each pair forms a meaningful test case:

```php
#[DataZip(
    new DataProvider('credentials'),
    new DataProvider('expectedPermissions'),
)]
public function testUserPermissions(string $login, string $password, array $permissions): void
{
    $user = $this->auth->login($login, $password);
    Assert::same($permissions, $user->getPermissions());
}

// credentials: [['admin', 'secret'], ['guest', '1234']]
// expectedPermissions: [[['read', 'write', 'delete']], [['read']]]
//
// Test runs 2 times:
// 1. admin/secret → ['read', 'write', 'delete']
// 2. guest/1234 → ['read']
```

Arguments from all providers merge into a single test call. In the example above, `credentials` provides two arguments (`$login`, `$password`), while `expectedPermissions` provides one (`$permissions`).

### Providers of Different Lengths

If providers have different lengths, the number of datasets is determined by the shortest provider:

```php
#[DataZip(
    new DataProvider('inputs'),   // 3 items
    new DataProvider('outputs'),  // 2 items
)]
public function testTransform(string $input, string $output): void { ... }

// inputs:  [['a'], ['b'], ['c']]
// outputs: [['x'], ['y']]
//
// Runs 2 times (limited by outputs):
// 1. 'a', 'x'
// 2. 'b', 'y'
// Third item from inputs ('c') is ignored
```

::: tip Keys in Reports
Dataset labels are joined with `|`. If datasets are named `admin` and `full-access`, the report shows `admin|full-access`.
:::

## DataCross

Creates all possible combinations of values from providers (cartesian product). Useful for testing independent parameters that can combine in any way.

```php
#[DataCross(
    new DataProvider('browsers'),
    new DataProvider('screenSizes'),
)]
public function testResponsiveLayout(string $browser, int $width, int $height): void
{
    $this->driver->setBrowser($browser);
    $this->driver->setViewport($width, $height);

    Assert::true($this->page->isLayoutCorrect());
}

// browsers: [['chrome'], ['firefox'], ['safari']]
// screenSizes: [[1920, 1080], [768, 1024], [375, 667]]
//
// Runs 9 times — each browser with each screen size:
// chrome × 1920×1080, chrome × 768×1024, chrome × 375×667,
// firefox × 1920×1080, ...
```

::: warning Watch the Combination Count
Test count grows multiplicatively. Three providers with 5 items each means 125 tests. Use `DataCross` mindfully.
:::

::: tip Keys in Reports
Labels are joined with `×`. Datasets `chrome` and `mobile` produce the key `chrome×mobile`.
:::

## DataUnion

To combine data from multiple sources, you can simply list attributes above the method:

```php
#[DataProvider('adminUsers')]
#[DataProvider('regularUsers')]
#[DataSet(['guest'], 'guest')]
public function testUserCanLogin(string $username): void
{
    // Runs for all: adminUsers, then regularUsers, then guest
}
```

`DataUnion` is needed when combining must happen inside another attribute — for example, inside `DataCross` or `DataZip`:

```php
#[DataCross(
    new DataUnion(
        new DataProvider('legacyFormats'),
        new DataProvider('modernFormats'),
    ),
    new DataProvider('compressionLevels'),
)]
public function testExport(string $format, int $compression): void
{
    // All formats (legacy + modern) are crossed with each compression level
}
```

Without `DataUnion`, you'd have to either create a separate provider that merges formats, or duplicate `DataCross` for each format source.

## Combining Providers

Inside `DataZip`, `DataCross`, and `DataUnion` you can use any data providers — `DataProvider`, `DataSet`, and even nest them within each other.

### Mixing Types

Handy when some parameters are fixed while others come from a provider:

```php
#[DataCross(
    new DataSet(['mysql'], 'mysql'),
    new DataSet(['pgsql'], 'pgsql'),
    new DataProvider('migrationScenarios'),
)]
public function testMigration(string $driver, array $scenario): void { ... }
```

Or more compact with a `DataProvider` for drivers:

```php
#[DataCross(
    new DataProvider('databaseDrivers'),
    new DataProvider('migrationScenarios'),
)]
public function testMigration(string $driver, array $scenario): void { ... }
```

### Nested Combinations

For complex scenarios, providers can be nested:

```php
#[DataZip(
    new DataCross(
        new DataProvider('users'),
        new DataProvider('roles'),
    ),
    new DataProvider('expectedResults'),
)]
public function testAccessControl(string $user, string $role, bool $expected): void
{
    $this->actAs($user)->withRole($role);
    Assert::same($expected, $this->canAccess('/admin'));
}

// users × roles produces all user-role combinations,
// then they're paired with expected results