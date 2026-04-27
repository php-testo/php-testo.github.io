---
llms: "footer"
llms_description: "Best practices for writing tests with Testo: when to add PHPDoc, how to avoid duplication with parameterized tests, and tips for generating comprehensive test coverage."
llms_priority: 1
---

## Best Practices

### PHPDoc descriptions

A PHPDoc block on a test method becomes the test description in Testo output. Add one when the method name alone doesn't fully convey what the test checks or why. If the name is self-explanatory, skip the PHPDoc — an empty description is better than a redundant one.

```php
/**
 * Null is returned instead of throwing when the user does not exist,
 * so callers can handle missing users without try/catch.
 */
public function returnsNullForMissingUser(): void {}
```

### Avoid test duplication using parameterized tests

When tests differ only in input/output values, use parameterized tests:

- **`#[DataSet]`** — few datasets (2–4), not reused elsewhere; inline, no extra method needed
- **`#[DataProvider]`** — large or reused datasets, or when data generation requires logic; returns `iterable`, string keys become labels; can be an invokable class or any callable

When positive and negative cases share the same test logic, combine them into a single parameterized test to keep all scenarios visible in one place:

```php
#[DataSet(['user@example.com', true], 'valid email')]
#[DataSet(['userexample.com', false], 'missing @')]
#[DataSet(['', false], 'empty string')]
public function validate(string $email, bool $expected): void { ... }
```

For larger datasets split by outcome, use `#[DataCross]` twice to pair each provider with its expected result:

```php
#[DataCross(new DataProvider('validInputs'), new DataSet([true]))]
#[DataCross(new DataProvider('invalidInputs'), new DataSet([false]))]
public function validate(string $email, bool $expected): void { ... }
```

### Test coverage

Generate both positive and negative scenarios. Positive tests verify expected behaviour; negative tests verify what happens on invalid input, missing data, or error conditions.

Pay attention to boundary values — these matter most for mutation testing:

- off-by-one values (`0`, `1`, `n-1`, `n`, `n+1`)
- empty collections, null, empty string
- type boundaries (e.g. `PHP_INT_MAX`, `PHP_INT_MIN`)
- transitions between valid and invalid ranges
