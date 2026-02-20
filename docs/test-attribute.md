---
llms_description: "#[Test] attribute on classes, methods, and functions for explicit test declaration"
---

# Test Attribute

The `#[Test]` attribute explicitly marks a method, function, or class as a test.

Can be placed on:

- **Class** — all public methods with `void` return type become tests
- **Method** — only that method is a test
- **Function** — the function is a test

```php
#[Test]
final class OrderTest
{
    public function createsOrder(): void { /* ... */ }

    public function calculatesTotal(): void { /* ... */ }

    public function appliesDiscount(): void { /* ... */ }
}

final class UserTest
{
    #[Test]
    public function validatesEmail(): void { /* ... */ }

    #[Test]
    public function checksPermissions(): void { /* ... */ }
}

#[Test]
function checks_environment(): void { /* ... */ }
```

## When to Use

Use `#[Test]` when:

- You want **explicit** test declaration without relying on naming patterns
- Your method/function name doesn't follow the `test` prefix convention
- You prefer attribute-based discovery over convention-based
