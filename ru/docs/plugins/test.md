# Атрибут Test

Атрибут `#[Test]` явно помечает метод, функцию или класс как тест.

Можно ставить на:

- **Класс** — все публичные методы с возвращаемым типом `void` или `never` становятся тестами
- **Метод** — только этот метод является тестом
- **Функцию** — функция является тестом

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

## Когда использовать

Используйте `#[Test]`, когда:

- Хотите **явно** объявлять тесты без привязки к именам
- Имя метода/функции не следует конвенции с префиксом `test`
- Предпочитаете обнаружение по атрибутам, а не по конвенциям
