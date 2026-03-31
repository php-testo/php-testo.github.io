---
title: "Beta-тестирование открыто!"
outline: [2, 3]
date: 2026-04-01
description: "Начните тестировать с Testo уже сегодня и помогите сделать его лучше к релизу!"
image: /blog/beta-testo/img-0.jpg
author: Алексей Гагарин
faqLevel: false
---

# Beta-тестирование открыто!

## Немного маркетинга

1. Testo уживается с любыми библиотеками и инструментами, не вызывая проблем:
   - Не зависит от PHPUnit. Это не очередная обертка над ним, а полноценный фреймворк с нуля.
   - Не патчит `nikic/php-parser` и даже его не [использует](https://github.com/sebastianbergmann/phpunit/issues/6381). Конфликтов не будет.
   - PHP 8.2+ — самая широкая поддержка версий PHP.

2. AI-агенты легко сгенерируют Testo-тесты, просто скормите им `llms.txt` ([дока](/ru/docs/ai-agents.md)).

3. Благодаря системе плагинов вы можете слепить из Testo именно то, что нужно вам. Ограничений, кроме иммутабельности, нет.
   - Все фичи Testo — это плагины, которые можно включать и отключать по желанию.
   - Написать свой плагин? Пара десятков строк кода, и он уже в деле.
   - Каждый Test Suite может иметь индивидуальный набор плагинов.

4. Выходите за рамки привычного тестирования:
   - Надо тестировать прямо в `src`? Для этого уже есть [встроенные тесты](/ru/docs/plugins/inline.md) и [бенчмарки](/ru/docs/plugins/bench.md).
   - Сделать свой атрибут с крутой логикой?  проще простого. <attr>\Testo\Retry</attr> — отличный пример.
   - Система пайплайнов и мидлварей, система событий и плагины дают безграничные возможности для расширения и кастомизации.

5. Сделано разработчиком для разработчиков.
   - Без наследия вроде абстрактного `TestCase`.
   - Минимум боилерплейта благодаря атрибутам.
   - Типизация даже в проверках.
   - Привычный синтаксис ООП и PHP, без магии и DSL.

6. Полноценный [плагин для PHPStorm](https://plugins.jetbrains.com/plugin/28842-testo) тоже имеется.


**Готовы попробовать?**

## Установка и настройка

Всего 3 шага:

1. Установите Testo через Composer:
    ```bash
    composer require --dev testo/testo
    ```

2. Создайте `testo.php` в корне проекта:

    ```php
    <?php

    declare(strict_types=1);

    use Testo\Application\Config\ApplicationConfig;
    use Testo\Application\Config\SuiteConfig;

    return new ApplicationConfig(
        suites: [
            new SuiteConfig(
                name: 'Sources',
                location: ['src'],
            ),
            new SuiteConfig(
                name: 'Tests',
                location: ['tests'],
            ),
        ],
    );
    ```

    ::: question Что это за файл?
    Testo конфигурируется PHP-файлом, который возвращает объект <class>\Testo\Application\Config\ApplicationConfig</class>.
    Если файла нет, Testo попытается запустить тесты из папки `tests` с дефолтными настройками.

    Здесь мы определили два набора тестов:
    - `Sources` для встроенных тестов и бенчмарков прямо в коде проекта, в папке `src`;
    - `Tests` для привычных Unit-тестов в папке `tests`.
    :::

3. Установите плагин для PHPStorm:

    <JetBrainsPlugin />

Запускать тесты можно прямо из PHPStorm, с помощью плагина, или через CLI:

```bash
./vendor/bin/testo
```

## Первые тесты

### Unit-тест

Создаём обычный класс с методами, помеченными атрибутом <attr>\Testo\Test</attr>. Никакого наследования от базовых классов:

```php
final class OrderTest
{
    #[Test]
    public function calculatesTotal(): void
    {
        $order = new Order();
        $order->addItem('Book', price: 15.0, quantity: 2);
        $order->addItem('Pen', price: 3.0, quantity: 5);

        Assert::same($order->total(), 45.0);
    }

    #[Test]
    #[DataSet([100.0, 10, 90.0], '10% off')]
    #[DataSet([100.0, 0, 100.0], 'no discount')]
    #[DataSet([0.0, 50, 0.0], 'zero price')]
    public function appliesDiscount(float $price, int $percent, float $expected): void
    {
        $result = Order::applyDiscount($price, $percent);

        Assert::same($result, $expected);
    }

    #[Test]
    #[ExpectException(InsufficientFundsException::class)]
    public function cannotOverdraw(): never
    {
        new Account(balance: 100)->withdraw(200);
    }
}
```

Методы фасада <class>\Testo\Assert</class> принимают интуитивно понятный прямой порядок аргументов: сначала `$actual` (проверяемое значение), затем `$expected` (ожидаемое значение). Это отличается от устаревшего подхода xUnit.

А вот как выглядят цепочки типизированных проверок — вместо тридцати методов вида `assertStringContains()`:

```php
Assert::string($email)->contains('@');

Assert::int($age)->greaterThan(0)->lessThan(150);

Assert::array($items)
    ->hasKeys('id', 'name')
    ->isList()
    ->notEmpty();

Assert::json($response->body())
    ->isObject()
    ->hasKeys('data', 'meta');
```

### Встроенные тесты

Тестируйте методы прямо там, где они объявлены. Отдельный тестовый файл не нужен — атрибут <attr>\Testo\Inline\TestInline</attr> запускает метод с заданными аргументами и проверяет результат. Работает даже с приватными методами:

```php
// src/Money.php
final class Money
{
    #[TestInline(['price' => 100.0, 'discount' => 0.1, 'tax' => 0.2], 108.0)]
    #[TestInline(['price' => 50.0, 'discount' => 0.0, 'tax' => 0.1], 55.0)]
    private static function calculateFinalPrice(
        float $price,
        float $discount,
        float $tax,
    ): float {
        return $price * (1 - $discount) * (1 + $tax);
    }
}
```

Идеально для чистых функций и быстрого прототипирования — тест живёт рядом с кодом и обновляется вместе с ним.

### Бенчмарки

Моментально сравнивайте производительность функций и методов не отвлекаясь на обвязку: достаточно повесить атрибут <attr>\Testo\Bench</attr> на функцию и бенчи уже полетели:

```php
#[Bench(
    callables: [
        'multiply' => 'viaMultiply',
        'shift'    => 'viaShift',
    ],
    arguments: [1, 5_000],
    calls: 2_000_000,
)]
function viaDivision(int $a, int $b): int
{
    $d = $b - $a + 1;
    return (int) (($d - 1) * $d / 2) + $a * $d;
}

function viaMultiply(int $a, int $b): int
{
    $d = $b - $a + 1;
    return (int) (($d - 1) * $d * 0.5) + $a * $d;
}

function viaShift(int $a, int $b): int
{
    $d = $b - $a + 1;
    return ((($d - 1) * $d) >> 1) + $a * $d;
}
```

```
+---+----------+-------+---------+------------------+--------+
| # | Name     | Iters | Calls   | Avg Time         | RStDev |
+---+----------+-------+---------+------------------+--------+
| 2 | current  | 10    | 2000000 | 75.890µs         | ±0.79% |
| 3 | multiply | 10    | 2000000 | 78.821µs (+3.9%) | ±0.47% |
| 1 | shift    | 10    | 2000000 | 70.559µs (-7.0%) | ±0.70% |
+---+----------+-------+---------+------------------+--------+
```

## Интересно?

Если вас заинтересовал Testo, но вы хотите узнать о нём чуть больше, обязательно ознакомьтесь с этими статьями:

- [«К коллайдеру!»](./collider.md) — про бенчмарки и сравнение производительности.
- [«Testo. Assert и Expect»](./assert-and-expect.md) — про новый и старый API для проверок и ожиданий.
- [«Data Providers»](./data-providers.md) — про мощные и гибкие провайдеры данных для тестов.

Поставьте звёздочку на [GitHub](https://github.com/php-testo/testo) и оценку [PHPStorm плагину](https://plugins.jetbrains.com/plugin/28842-testo) — это очень поможет Testo стать более заметным.

## Что дальше?

Сейчас идёт бета-тестирование и мы двигаемся к релизу.
Пользовательский API стабилизировался, но есть ещё несколько вещей, которые нужно доделать:

- Причесать вывод отчётов в CLI и PHPStorm, добавить diff.
- Всякие мелочи, вроде перехвата STDOUT и PHP-ошибок.
- Параллельный запуск тестов и изолированный запуск в отдельном процессе.
- Допилить незначительные вещи в бенчах и internal, чтобы было совсем хорошо.
- Всякие организационные моменты, вроде "раскидать монорепу" и дописать документацию.

Codecov и Mocks, возможно, тоже подъедут к релизу, но это уже не точно.

Вы же, в свою очередь, можете помочь с тестированием и фидбеком, чтобы релиз был максимально гладким и безболезненным.
Приходите в [GitHub Issues](https://github.com/php-testo/testo/issues) или [Telegram-чат](https://t.me/spiralphp/10863) с идеями, вопросами и проблемами — будем разбираться вместе!
