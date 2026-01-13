# Атрибут Test

Атрибут `#[Test]` явно помечает метод, функцию или класс как тест.

Можно ставить на:

- **Класс** — все публичные методы становятся тестами
- **Метод** — только этот метод является тестом
- **Функцию** — функция является тестом

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

## Когда использовать

Используйте `#[Test]`, когда:

- Хотите **явно** объявлять тесты без привязки к именам
- Имя метода/функции не следует конвенции с префиксом `test`
- Предпочитаете обнаружение по атрибутам, а не по конвенциям

Атрибут можно комбинировать с [конвенциями именования](./naming-conventions) в одном проекте.
