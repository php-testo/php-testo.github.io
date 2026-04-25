---
llms: true
llms_description: "Complete working examples of Testo tests covering common patterns"
---

## Data Providers

Use data providers when multiple test cases differ only in input/output values. This eliminates test method duplication — one test body, many datasets.

### Without a data provider (avoid this)

Each scenario becomes its own method even though the structure is always the same:

```php
final class AssertJsonTest
{
    #[Test]
    public function invalidJson(): void
    {
        $result = TestRunner::runTest([AssertJsonNegative::class, 'invalidJson']);
        Assert::same($result->status, Status::Failed);
        Assert::instanceOf($result->failure, Assertion::class);
        Assert::string($result->failure->getFailReason())->contains('got');
    }

    #[Test]
    public function isObjectOnArray(): void
    {
        $result = TestRunner::runTest([AssertJsonNegative::class, 'isObjectOnArray']);
        Assert::same($result->status, Status::Failed);
        Assert::instanceOf($result->failure, Assertion::class);
        Assert::string($result->failure->getFailReason())->contains('got array');
    }

    #[Test]
    public function isArrayOnObject(): void
    {
        $result = TestRunner::runTest([AssertJsonNegative::class, 'isArrayOnObject']);
        Assert::same($result->status, Status::Failed);
        Assert::instanceOf($result->failure, Assertion::class);
        Assert::string($result->failure->getFailReason())->contains('got object');
    }

    // ... 8 more identical-looking methods
}
```

Three methods shown, ten or more in reality — any addition means another copy-pasted block.

### With a data provider (prefer this)

One test method, one provider method:

```php
use Testo\Assert;
use Testo\Assert\State\Assertion;
use Testo\Core\Value\Status;
use Testo\Data\DataProvider;
use Testo\Test;
use Testo\Testing\Traits\TestRunner;

final class AssertJsonTest
{
    /**
     * Runs each failing assertion scenario through the test runner and checks
     * that the failure message contains the expected fragment, confirming that
     * error output is precise enough to identify the problem without reading the code.
     */
    #[Test]
    #[DataProvider('failureCases')]
    public function reportsCorrectly(string $method, string $expectedFragment): void
    {
        $result = TestRunner::runTest([AssertJsonNegative::class, $method]);

        Assert::same($result->status, Status::Failed);
        Assert::instanceOf($result->failure, Assertion::class);
        Assert::string($result->failure->getFailReason())->contains($expectedFragment);
    }

    public function failureCases(): iterable
    {
        yield 'invalid json'         => ['invalidJson',          'got'];
        yield 'array on object'      => ['isObjectOnArray',      'got array'];
        yield 'object on array'      => ['isArrayOnObject',      'got object'];
        yield 'primitive on object'  => ['isPrimitiveOnObject',  'got object'];
        yield 'empty on non-empty'   => ['emptyOnNonEmpty',      '3 element'];
        yield 'wrong count'          => ['wrongCount',           'got 3'];
        yield 'missing keys'         => ['missingKeys',          'missing key'];
        yield 'exceeds max depth'    => ['exceedsMaxDepth',      'actual depth is 3'];
        yield 'wrong matches type'   => ['wrongMatchesType',     'got 42'];
        yield 'structure on prim'    => ['isStructureOnPrimitive', 'got int'];
    }
}
```

Each `yield` key becomes the dataset label in reports — when a test fails you see exactly which scenario broke (`missing keys`, `wrong count`, etc.) without reading the code.

## Inline Datasets with `#[DataSet]`

When there are only a few cases and the data is not reused elsewhere, a separate provider method is overkill. Use `#[DataSet]` — each attribute is one test run, defined directly on the method.

### Without inline datasets (avoid this)

Three near-identical methods testing the same rule with different inputs:

```php
final class EmailValidationTest
{
    #[Test]
    public function emptyEmailIsInvalid(): void
    {
        Assert::false(Email::isValid(''));
    }

    #[Test]
    public function malformedEmailIsInvalid(): void
    {
        Assert::false(Email::isValid('not-an-email'));
    }

    #[Test]
    public function wellFormedEmailIsValid(): void
    {
        Assert::true(Email::isValid('user@example.com'));
    }
}
```

### With `#[DataSet]` (prefer this)

One method, three datasets declared inline:

```php
use Testo\Assert;
use Testo\Data\DataSet;
use Testo\Test;

final class EmailValidationTest
{
    #[Test]
    #[DataSet(['', false], 'empty')]
    #[DataSet(['not-an-email', false], 'invalid format')]
    #[DataSet(['user@example.com', true], 'valid')]
    public function validates(string $email, bool $expected): void
    {
        Assert::same($expected, Email::isValid($email));
    }
}
```

The second argument to `#[DataSet]` is the label shown in failure reports — the same role as `yield 'key'` in a data provider.

### When to pick `#[DataSet]` vs `#[DataProvider]`

| | `#[DataSet]` | `#[DataProvider]` |
|---|---|---|
| Number of cases | 2–4 | 5 or more |
| Data reused across tests | No | Yes |
| Needs generation logic | No | Yes |
| Readable at a glance | Yes | Requires jumping to provider |
