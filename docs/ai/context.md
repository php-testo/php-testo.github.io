---
llms: "inline"
llms_description: "Testo framework overview for AI agents: architecture, key concepts, and mental model"
---

## Best Practices

### PHPDoc descriptions

Add a PHPDoc block to a test method only when its intent is not immediately obvious from the method name and code alone. If the method is named `testEmailMustBeUnique` and the code clearly validates uniqueness, a comment adds nothing.

Add one when the test covers a non-obvious rule, a subtle edge case, or when the relationship between the name and the actual behaviour is indirect — for example, when the test verifies a contract ("returns `null` instead of throwing") that a reader would not expect.

Example of a useful PHPDoc:
```php
/**
 * Null is returned instead of throwing when the user does not exist,
 * so callers can handle missing users without try/catch.
 */
public function returnsNullForMissingUser(): void
```

Example where it would be noise — the name says everything:
```php
public function testEmailMustBeUnique(): void
```

### Avoid test duplication

When multiple tests differ only in input/output values, avoid writing separate methods. Use parameterized tests instead:

- **`#[DataSet]`** — when there are few datasets (2–4) and the data is not reused across other tests. Everything stays in one place, no extra method is needed.
- **`#[DataProvider]`** — when the dataset is large, reused across multiple tests, or requires its own logic to generate. The provider is a separate method that returns an `iterable`; string keys of yielded items become dataset labels in reports.

In rare cases a data provider can be a separate invokable class or any callable — useful when data loading logic is complex or shared across test classes.
