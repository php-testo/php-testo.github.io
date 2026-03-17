---
outline: [2, 3]
---

# Пишем тесты

Testo не диктует, как и где писать тесты. Отдельные тесты в классах и функциях, встроенные тесты прямо на продакшн-коде, бенчмарки — все подходы можно комбинировать в одном проекте.

**Подходы к написанию тестов**

| Подход                                | Обнаружение           | Когда использовать                 |
|---------------------------------------|-----------------------|------------------------------------|
| [Отдельные тесты](#отдельные-тесты)   | `#[Test]` / конвенции | Unit, feature, integration         |
| [Встроенные тесты](#встроенные-тесты) | `#[TestInline]`       | Простые проверки в коде приложения |
| [Бенчмарки](#бенчмарки)               | `#[Bench]`            | Сравнение производительности       |

## Отдельные тесты

Чаще всего тесты пишутся в классах и функциях, отдельно от тестируемого кода, в директории `tests/`.

Хороший тест следует паттерну AAA — Arrange, Act, Assert:

::: code-group
```php [AAA]
function calculatesOrderTotal(): void
{
    // Arrange — подготовка
    $order = new Order();
    $order->addItem('Book', price: 15.0, quantity: 2);
    $order->addItem('Pen', price: 3.0, quantity: 5);

    // Act — действие
    $total = $order->total();

    // Assert — проверка
    Assert::same($total, 45.0);
}
```
```php [Исключение]
function throwsOnNegativeAmount(): never
{
    // Arrange
    $account = new Account(balance: 100);

    // Assert — до действия
    Expect::exception(InsufficientFundsException::class);

    // Act
    $account->withdraw(200);
}
```
```php [Простой тест]
// Для простых тестов AAA избыточен
function defaultCurrencyIsUsd(): void
{
    Assert::same(new Money(100)->currency, 'USD');
}
```
:::

Для проверок Testo предоставляет два фасада из [плагина Assert](plugins/assert.md):

- `Assert` — утверждения, проверяются здесь и сейчас. Поддерживает цепочки типизированных проверок.
- `Expect` — ожидания, проверяются после завершения теста (исключения, утечки памяти).

```php
// Assert — утверждения
Assert::same($user->name, 'John');
Assert::true($user->isActive);
Assert::string($email)->contains('@');

// Assert — цепочка типизированных проверок
Assert::string($response->body)
    ->contains('success')
    ->notContains('error');

// Expect — ожидания поведения теста
Expect::exception(\RuntimeException::class);
Expect::notLeaks($connection);
```

### Атрибуты

Вместо базовых классов или магических методов Testo делает ставку на атрибуты.

- Атрибут `#[Test]` из [плагина Test](plugins/test.md) помечает методы и функции как отдельные тесты:

    ::: code-group
    ```php [Методы]
    // tests/Unit/Order.php
    final class Order
    {
        #[Test]
        public function createsOrder(): void { /* ... */ }
    
        #[Test]
        public function calculatesTotal(): void { /* ... */ }
    }
    ```
    ```php [Функции]
    // tests/Unit/order.php
    #[Test]
    function creates_order(): void { /* ... */ }
    
    #[Test]
    function calculates_total(): void { /* ... */ }
    ```
    :::


- Вместо копирования одного и того же теста для разных данных используйте атрибуты `#[DataSet]` и `#[DataProvider]` из плагина [Data](plugins/data.md), которые параметризуют тест разными наборами данных:

    ```php
    #[DataSet([1, 2, 3])]
    #[DataSet([5, 5, 10])]
    public function sum(int $a, int $b, int $expected): void { /* ... */ }
    ```

- А вместо `Expect::exception` можно использовать атрибут `#[ExpectException]`, который просто немного компактнее и добавляет наглядности:

    ```php
    #[ExpectException(\InsufficientFundsException::class)]
    function throwsOnNegativeAmount(): never
    {
        new Account(balance: 100)->withdraw(200);
    }
    ```

- Атрибут `#[Retry]` из плагина [Retry](plugins/retry.md) перезапустит тест при падении, пометив его как нестабильный:

    ```php
    #[Retry(maxAttempts: 3)]
    public function flakyExternalService(): void { /* ... */ }
    ```

- Хуки жизненного цикла из плагина [Lifecycle](plugins/lifecycle.md) помогут подготовить окружение и очистить состояние между тестами:
    - `#[BeforeTest]` — выполняется перед каждым тестом.
    - `#[AfterTest]` — выполняется после каждого теста.
    - `#[BeforeClass]` — выполняется один раз перед всеми тестами в классе.
    - `#[AfterClass]` — выполняется один раз после всех тестов в классе.

::: info
Посетите страницы плагинов для получения подробной информации о каждом атрибуте и других интересных возможностях.
:::

### Конвенции именования

[Плагин Convention](plugins/convention.md) находит тесты по паттернам именования — атрибуты не нужны. По умолчанию это суффикс `*Test` на классе и префикс `test*` на методах:

```php
// tests/Unit/OrderTest.php
final class OrderTest
{
    public function testCreatesOrder(): void { /* ... */ }

    public function testCalculatesTotal(): void { /* ... */ }

    public function testAppliesDiscount(): void { /* ... */ }
}
```

::: info
Convention не входит в набор плагинов по умолчанию — при необходимости его нужно [подключить](configuration.md).
:::

### Практические советы

- **Называйте тесты как сценарии** — `calculatesDiscountForVipCustomer` понятнее, чем `testDiscount`. При падении имя теста — первое, что вы увидите.
- **Один тест — один сценарий.** Несколько проверок в тесте — нормально, но несколько сценариев — нет. Если тест проверяет и создание, и удаление — разделите их.
- **Придерживайтесь AAA** (Arrange, Act, Assert). При этом комментарии `// Arrange // Act // Assert` не обязательны: достаточно разделять блоки пустой строкой.

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

- **Unit** — быстрые изолированные тесты, можно запускать параллельно.
- **Feature** — требуют контейнер приложения, HTTP-клиент, базу данных.
- **Integration** — работают с реальными внешними сервисами, последовательный запуск.
- **Sources** — inline-тесты и бенчмарки в коде приложения.

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
