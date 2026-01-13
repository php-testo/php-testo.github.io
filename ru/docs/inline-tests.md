# Встроенные тесты

Встроенные тесты позволяют писать тесты прямо на тестируемом методе с помощью атрибута `#[TestInline]`. Отдельный тестовый класс не нужен.

```php
use Testo\Sample\TestInline;

#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
public function sum(int $a, int $b): int
{
    return $a + $b;
}
```

Каждый атрибут запускает метод с заданными аргументами и проверяет результат.

## Когда использовать

Встроенные тесты хорошо подходят для:
- **Простых чистых функций**, где отдельный тестовый файл был бы избыточным
- **Приватных вспомогательных методов**, которые хочется протестировать без изменения видимости
- **Прототипирования**, когда нужна быстрая проверка без переключения контекста

Для больших наборов тестов (10+ случаев) или тестов, требующих пояснений, лучше писать отдельные тесты с [DataProvider](./data-providers).

## Настройка

Рекомендуется создать отдельный Test Suite для inline тестов. Поскольку inline тесты находятся в коде приложения (не в `tests/`), прочие поисковики тестов там не нужны — только `TestInlineFinder`.

## Сигнатура атрибута

```php
TestInline(array $arguments, mixed $result = null)
```

- `$arguments` — массив значений, передаваемых в метод
- `$result` — ожидаемое возвращаемое значение (или замыкание для кастомных проверок)

## Тестирование приватных методов

Нужно протестировать приватный метод? Просто добавьте атрибут:

```php
#[TestInline(['password123'], false)]  // too short
#[TestInline(['Password123!'], true)]  // valid
#[TestInline(['pass'], false)]  // no number
private function isStrongPassword(string $password): bool
{
    return strlen($password) >= 8
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[0-9]/', $password)
        && preg_match('/[^A-Za-z0-9]/', $password);
}
```

Метод остаётся приватным — Testo сам разбирается с рефлексией.

## Именованные аргументы

Используйте именованные аргументы для лучшей читаемости:

```php
#[TestInline(['price' => 100.0, 'discount' => 0.1, 'tax' => 0.2], 108.0)]
#[TestInline(['price' => 50.0, 'discount' => 0.0, 'tax' => 0.1], 55.0)]
private function calculateFinalPrice(
    float $price,
    float $discount,
    float $tax
): float {
    return $price * (1 - $discount) * (1 + $tax);
}
```

## Кастомные проверки

*Доступно в PHP 8.5+ (замыкания в атрибутах)*

Для сложных проверок передайте замыкание вторым параметром:

```php
use Testo\Assert;

#[TestInline([10, 3], fn($r) => Assert::greaterThan(3, $r))]
public function divide(int $a, int $b): float
{
    return $a / $b;
}
```

Замыкание получает результат и может выполнять любые проверки:

```php
#[TestInline(
    arguments: ['john.doe@example.com'],
    result: function (User $user) {
        Assert::same('john.doe@example.com', $user->email);
        Assert::true($user->isActive);
        Assert::notNull($user->createdAt);
    }
)]
public function createUser(string $email): User
{
    // ...
}
```
