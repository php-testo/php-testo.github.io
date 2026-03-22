# Атрибут Test

Плагин отвечает за обнаружение тестов по атрибуту <attr>\Testo\Test</attr>. Это основной способ явно объявить метод, функцию или класс тестом.

<plugin-info name="Test" class="\Testo\Test\TestPlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

<signature h="2" name="#[\Testo\Test()]">
<short>Явно помечает метод, функцию или класс как тест.</short>
<description>
Можно использовать на **классах**, **методах** и **функциях**. В случае применения на классе (Test Case), все публичные методы с возвращаемым типом `void` или `never` становятся тестами. В остальных случаях, только помеченный элемент становится тестом.
</description>
<example>
::: code-group
```php [#[Test] на классе]
// tests/Unit/Order.php
#[Test]
final class Order
{
    public function createsOrder(): void { /* ... */ }

    public function calculatesTotal(): void { /* ... */ }
}
```
```php [#[Test] на методе]
// tests/Unit/Order.php
final class Order
{
    #[Test]
    public function createsOrder(): void { /* ... */ }

    #[Test]
    public function calculatesTotal(): void { /* ... */ }
}
```
```php [Функция]
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
