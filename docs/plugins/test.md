---
llms_description: "#[Test] attribute on classes, methods, and functions for explicit test declaration"
---

# Test Attribute

The `#[Test]` attribute explicitly marks a method, function, or class as a test.

Can be placed on:

- **Class** — all public methods with `void` or `never` return type become tests
- **Method** — only that method is a test
- **Function** — the function is a test

::: code-group
```php [#[Test] on class]
// tests/Unit/Order.php
#[Test]
final class Order
{
    public function createsOrder(): void { /* ... */ }

    public function calculatesTotal(): void { /* ... */ }
}
```
```php [#[Test] on method]
// tests/Unit/Order.php
final class Order
{
    #[Test]
    public function createsOrder(): void { /* ... */ }

    #[Test]
    public function calculatesTotal(): void { /* ... */ }
}
```
```php [Function]
// tests/Unit/order.php
#[Test]
function creates_order(): void { /* ... */ }

#[Test]
function calculates_total(): void { /* ... */ }

#[Test]
function applies_discount(): void { /* ... */ }
```
:::

## When to Use

Use `#[Test]` when:

- You want **explicit** test declaration without relying on naming patterns
- Your method/function name doesn't follow the `test` prefix convention
- You prefer attribute-based discovery over convention-based
