---
llms_description: "Parameterized tests with data providers. #[DataSet] for inline data, #[DataProvider] with callables, #[DataZip] for pairing by index, #[DataCross] for cartesian product, #[DataUnion] for merging. Nested combinations and labeling."
---

# Data Providers

Data providers let you run one test with different sets of input data. Each set runs as a separate test.

<signature h="2" name="#[\Testo\Data\DataSet(array $arguments, ?string $name = null)]">
<short>Declares a set of arguments for a parameterized test. Can be used multiple times — each attribute creates a separate test run.</short>
<param name="$arguments">Array of values passed to the test method.</param>
<param name="$name">Label displayed in reports. Helps identify which scenario failed.</param>
<example>
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
</example>
<example>
With labels:

```php
#[DataSet([1, 1, 2], 'positive numbers')]
#[DataSet([-1, -1, -2], 'negative numbers')]
#[DataSet([0, 0, 0], 'zeros')]
public function testSum(int $a, int $b, int $expected): void { ... }
```
</example>
</signature>

<signature h="2" name="#[\Testo\Data\DataProvider(callable|string $provider)]">
<short>Provides data for a parameterized test from a method or callable.</short>
<param name="$provider">Data source: method name (`'method'`), callable (`[Class::class, 'method']`), closure, or invokable object. Must return `iterable`. String keys of elements become dataset labels in reports.</param>
<example>
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
}
```
</example>
</signature>

### Flexible Provider Sources

<attr>\Testo\Data\DataProvider</attr> accepts various callable types:

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

<signature h="2" name="#[\Testo\Data\DataZip(DataProviderAttribute ...$providers)]">
<short>Pairs up providers element by element.</short>
<description>
The first item from the first provider joins with the first from the second, second with second, and so on. Arguments from all providers merge into a single test call.
</description>
<param name="$providers">Data providers to pair up.</param>
<example>
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
</example>
</signature>

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

<signature h="2" name="#[\Testo\Data\DataCross(DataProviderAttribute ...$providers)]">
<short>Creates all possible combinations from providers (cartesian product).</short>
<param name="$providers">Data providers to combine.</param>
<example>
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
</example>
</signature>

::: warning Watch the Combination Count
Test count grows multiplicatively. Three providers with 5 items each means 125 tests. Use <attr>\Testo\Data\DataCross</attr> mindfully.
:::

::: tip Keys in Reports
Labels are joined with `×`. Datasets `chrome` and `mobile` produce the key `chrome×mobile`.
:::

<signature h="2" name="#[\Testo\Data\DataUnion(DataProviderAttribute ...$providers)]">
<short>Merges data from multiple providers into a single sequential set.</short>
<description>
To combine data from multiple sources, you can simply list multiple <attr>\Testo\Data\DataProvider</attr> or <attr>\Testo\Data\DataSet</attr> above the method. <attr>\Testo\Data\DataUnion</attr> is needed when combining must happen inside another attribute — for example, inside <attr>\Testo\Data\DataCross</attr> or <attr>\Testo\Data\DataZip</attr>.
</description>
<param name="$providers">Data providers to merge into a single set.</param>
<example>
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
</example>
</signature>

## Combining Providers

Inside <attr>\Testo\Data\DataZip</attr>, <attr>\Testo\Data\DataCross</attr>, and <attr>\Testo\Data\DataUnion</attr> you can use any data providers — <attr>\Testo\Data\DataProvider</attr>, <attr>\Testo\Data\DataSet</attr>, and even nest them within each other.

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

Or more compact with a <attr>\Testo\Data\DataProvider</attr> for drivers:

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