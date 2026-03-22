---
llms_description: "#[Test] attribute on classes, methods, and functions for explicit test declaration"
---

# Test Attribute

The plugin discovers tests by the <attr>\Testo\Test()</attr> attribute. This is the primary way to explicitly declare a method, function, or class as a test.

<plugin-info name="Test" class="\Testo\Test\TestPlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

<signature h="2" name="#[\Testo\Test()]">
<short>Explicitly marks a method, function, or class as a test.</short>
<description>
Can be used on **classes**, **methods**, and **functions**. When applied to a class (Test Case), all public methods with a `void` or `never` return type become tests. Otherwise, only the marked element becomes a test.
</description>
<example>
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
</example>
</signature>
