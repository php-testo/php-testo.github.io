---
llms: "inline"
llms_description: "Testo framework overview for AI agents: architecture, key concepts, and mental model"
---

## Best Practices

### PHPDoc descriptions

Add a PHPDoc block only when the test intent is not obvious from the method name and code. Skip it if the name is self-explanatory.

```php
/**
 * Null is returned instead of throwing when the user does not exist,
 * so callers can handle missing users without try/catch.
 */
public function returnsNullForMissingUser(): void {}
```

### Avoid test duplication

When tests differ only in input/output values, use parameterized tests:

- **`#[DataSet]`** — few datasets (2–4), not reused elsewhere; inline, no extra method needed
- **`#[DataProvider]`** — large or reused datasets, or when data generation requires logic; returns `iterable`, string keys become labels; can be an invokable class or any callable

### Test coverage

Generate both positive and negative scenarios. Positive tests verify expected behaviour; negative tests verify what happens on invalid input, missing data, or error conditions.

Pay attention to boundary values — these matter most for mutation testing:

- off-by-one values (`0`, `1`, `n-1`, `n`, `n+1`)
- empty collections, null, empty string
- type boundaries (e.g. `PHP_INT_MAX`, `PHP_INT_MIN`)
- transitions between valid and invalid ranges
