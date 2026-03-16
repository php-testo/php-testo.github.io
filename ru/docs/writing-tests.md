# Пишем тесты

Testo не диктует, как и где писать тесты. Отдельные тесты в классах и функциях, встроенные тесты прямо на продакшн-коде, бенчмарки — все подходы можно комбинировать в одном проекте.

**Подходы к написанию тестов**

| Подход                                      | Обнаружение           | Когда использовать                           |
|---------------------------------------------|-----------------------|----------------------------------------------|
| [Отдельные тесты](#отдельные-тесты)         | `#[Test]` / конвенции | Unit, feature, integration                   |
| [Встроенные тесты](#встроенные-тесты)       | `#[TestInline]`       | Простые проверки в коде приложения            |
| [Бенчмарки](#бенчмарки)                     | `#[Bench]`            | Сравнение производительности                 |

## Отдельные тесты

Тесты в отдельных классах и функциях — основной способ. Тестовый код живёт отдельно от продакшн-кода, обычно в директории `tests/`.

Тесты пишутся в методах класса или в функциях. Testo находит их с помощью [плагина Test](plugins/test.md) (по атрибуту `#[Test]`) или [плагина Convention](plugins/convention.md) (по именованию). Convention не входит в набор плагинов по умолчанию — при необходимости его нужно [подключить](configuration.md).

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
```php [Конвенции]
// tests/Unit/OrderTest.php
final class OrderTest
{
    public function testCreatesOrder(): void { /* ... */ }

    public function testCalculatesTotal(): void { /* ... */ }

    public function testAppliesDiscount(): void { /* ... */ }
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

### Выразительнее с атрибутами

Атрибуты убирают boilerplate и делают тесты легче для чтения. Вместо копирования теста для каждого набора данных — [провайдеры данных](plugins/data.md). Вместо `try/catch` — `#[ExpectException]`. Вместо ручных retry — [`#[Retry]`](plugins/retry.md):

```php
#[Test]
#[DataSet([1, 2, 3])]
#[DataSet([5, 5, 10])]
public function sum(int $a, int $b, int $expected): void { /* ... */ }

#[Test]
#[ExpectException(\RuntimeException::class)]
public function throwsOnInvalidInput(): never
{
    throw new \RuntimeException('Invalid input');
}

#[Test]
#[Retry(maxAttempts: 3)]
public function flakyExternalService(): void { /* ... */ }
```

Также будет полезен [плагин Lifecycle](plugins/lifecycle.md), добавляющий хуки `#[BeforeEach]`, `#[AfterEach]`, `#[BeforeAll]`, `#[AfterAll]` для подготовки окружения и очистки состояния между тестами.

## Встроенные тесты

Тесты прямо на тестируемом методе с помощью атрибута `#[TestInline]` из [плагина Inline](plugins/inline.md) — даже отдельный тестовый класс не нужен:

```php
#[TestInline([1, 1], 2)]
#[TestInline([40, 2], 42)]
#[TestInline([-5, 5], 0)]
public static function sum(int $a, int $b): int
{
    return $a + $b;
}
```

Каждый атрибут запускает метод с заданными аргументами и проверяет результат. Работает даже с приватными методами.

Подходит для простых чистых функций и быстрого прототипирования.

## Бенчмарки

Атрибут `#[Bench]` из [плагина Bench](plugins/bench.md) сравнивает производительность функций:

```php
#[Bench(
    callables: [
        'array' => [self::class, 'sumInArray'],
    ],
    arguments: [1, 5_000],
    calls: 2000,
    iterations: 10,
)]
public static function sumInCycle(int $a, int $b): int
{
    $result = 0;
    for ($i = $a; $i <= $b; ++$i) {
        $result += $i;
    }
    return $result;
}
```

Testo прогоняет функции заданное число раз, фильтрует выбросы и выдаёт статистику с рекомендациями. Пошаговый разбор — в статье [«К коллайдеру!»](/ru/blog/collider.md).


## Структура папок

Рекомендуемая структура, подходящая для большинства приложений:

```
project/
├── src/                  ← inline-тесты, бенчмарки
│   └── ...
└── tests/
    ├── Unit/
    │   └── ...
    ├── Feature/
    │   └── ...
    └── Integration/
        └── ...
```

Каждый Suite — это не только отдельная папка, но и отдельный [SuiteConfig](configuration.md#suiteconfig) с нужным набором плагинов. Например:

- **Unit** — быстрые изолированные тесты, можно запускать параллельно
- **Feature** — требуют контейнер приложения, HTTP-клиент, базу данных
- **Integration** — работают с реальными внешними сервисами, последовательный запуск
- **Sources** — inline-тесты и бенчмарки в коде приложения

```php
return new ApplicationConfig(
    suites: [
        new SuiteConfig(name: 'Unit', location: ['tests/Unit'], plugins: [/* ... */]),
        new SuiteConfig(name: 'Feature', location: ['tests/Feature'], plugins: [/* ... */]),
        new SuiteConfig(name: 'Integration', location: ['tests/Integration'], plugins: [/* ... */]),
        new SuiteConfig(name: 'Sources', location: ['src'], plugins: [/* ... */]),
    ],
);
```

В модульной архитектуре тесты могут жить в модуле, а конфиги — собираться в один, как в [монорепозитории](configuration.md#монорепозиторий).
