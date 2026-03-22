# Встроенные тесты

Встроенные тесты позволяют писать тесты прямо на тестируемом методе с помощью атрибута <attr>\Testo\Inline\TestInline</attr>. При этом отдельная тестовая функция не нужна.

<plugin-info name="Inline" class="\Testo\Inline\InlineTestPlugin" included="\Testo\Application\Config\Plugin\SuitePlugins" />

## Настройка

Рекомендуется создать отдельный Test Suite для inline тестов, настроенный на папку `src`: встраивать тесты, скорее всего, вы будете в код приложения, а не в `tests/`.

<signature h="2" name="#[\Testo\Inline\TestInline(array $arguments, mixed $result = null)]">
<short>Объявляет встроенный тест на методе или функции.</short>
<description>
Атрибут можно использовать многократно — каждый атрибут создаёт отдельный тест.

Встроенные тесты хорошо подходят для:
- **Простых чистых функций**, где отдельный тестовый файл был бы избыточным.
- **Приватных вспомогательных методов**, которые хочется протестировать без изменения видимости.
- **Прототипирования**, когда нужна быстрая проверка без переключения контекста.

Для больших наборов тестов (10+ случаев) или тестов, требующих пояснений, лучше писать отдельные тесты с использованием провайдеров из плагина <plugin>Data</plugin>.
</description>
<param name="$arguments">Массив значений, передаваемых в метод. Поддерживаются именованные аргументы.</param>
<param name="$result">Ожидаемое возвращаемое значение.
Может принимать <class>\Closure(mixed $result)</class>, тогда вместо сравнения с конкретным значением будет выполняться произвольная проверка внутри замыкания.
</param>
<example>
Работает с публичными и приватными методами, а также с функциями:

::: code-group
```php [Приватный метод]
#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
private static function sum(int $a, int $b): int
{
    return $a + $b;
}
```
```php [Функция]
#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
function sum(int $a, int $b): int
{
    return $a + $b;
}
```
:::
</example>
<example>
Используйте именованные аргументы для лучшей читаемости:

```php
#[TestInline(['price' => 100.0, 'discount' => 0.1, 'tax' => 0.2], 108.0)]
#[TestInline(['price' => 50.0, 'discount' => 0.0, 'tax' => 0.1], 55.0)]
private static function calculateFinalPrice(
    float $price,
    float $discount,
    float $tax
): float {
    return $price * (1 - $discount) * (1 + $tax);
}
```
</example>
</signature>

## Сложные проверки

*Доступно в PHP 8.5+ (замыкания в атрибутах)*

Для сложных проверок передайте замыкание вторым параметром, в котором вы вольны выполнять любые утверждения над результатом, который будет передан в качестве аргумента:

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

В PHP 8.6 это станет ещё элегантнее благодаря [partial application](https://wiki.php.net/rfc/partial_function_application_v2):

```php
#[TestInline([10, 3], Assert::greaterThan(3, ?))]
public function divide(int $a, int $b): float
{
    return $a / $b;
}
```
