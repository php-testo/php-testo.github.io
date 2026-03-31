---
layout: home
title: Testo — PHP-фреймворк для тестирования
description: PHP-фреймворк для тестирования без наследования от TestCase. Чистый ООП, middleware-архитектура, PSR-14 события, фасады Assert/Expect.
image: /images/og-image.jpg

hero:
  name:
  text: |
    PHP-фреймворк
    для тестирования
    со вкусом хинкали
  tagline: |
    Или пельменей.
    Хлебобулочные тесты,
    сочный контроль над тестовой средой.
  image:
    src: /logo-full.svg
    alt: Testo Logo
  actions:
    - theme: brand
      text: Начать
      link: /ru/docs/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/php-testo/testo

features:
  - title: Чистый код
    details: Без наследования от <code>TestCase</code> или вообще без классов.

  - title: Для бэкенда
    details: Забудь JS всяк сюда входящий.

  - title: Интеграция с IDE
    details: Плагин для PhpStorm/IntelliJ IDEA с запуском, навигацией, отладкой и привычным workflow.

  - title: "#[Атрибуты]"
    details: Вместо магических конвенций. Минимум бойлерплейта, максимум выразительности.

  - title: Компактное ядро
    details: Всё остальное — middleware и диспетчеры событий с безграничной кастомизацией.

  - title: Продуманный API
    details: Раздельные фасады <code>Assert</code> (сейчас) и <code>Expect</code> (потом) с пайповыми ассертами для типобезопасных проверок.

  - title: Async Friendly
    details: Тестирование утечек, файберов и асинхронного кода инструментами из коробки.

  - title: "PHP >=8.2"
    details: Работает на всех актуальных версиях PHP.
---

<script setup>
import { data as jbPlugin } from '../.vitepress/theme/jetbrains-plugin.data'

const ideScreenshot = {
  light: '/images/ide-screenshot-light.jpg',
  dark: '/images/ide-screenshot-dark.jpg'
}

const assertTabs = [
  { name: 'Assert.php', slot: 'assert', icon: 'testo' },
  { name: 'Expect.php', slot: 'expect', icon: 'testo' },
  { name: 'Exception.php', slot: 'expectException', icon: 'testo' },
  { name: 'Attributes.php', slot: 'expectAttr', icon: 'testo-class' },
]

const declareTabs = [
  { name: 'Класс', slot: 'declare-class', icon: 'testo-class' },
  { name: 'Функция', slot: 'declare-function', icon: 'testo-function' },
  { name: 'Конвенция', slot: 'declare-convention', icon: 'testo-class' },
  { name: 'Inline', slot: 'declare-inline', icon: 'class' },
]

</script>

<div class="featured-post">
<a href="/ru/blog/beta-testo" class="featured-post-card">
  <div class="featured-post-image">
    <img src="/blog/beta-testo/img-0.jpg" alt="Beta-тестирование открыто!" />
  </div>
  <div class="featured-post-body">
    <span class="featured-post-title">Beta-тестирование открыто!</span>
    <p class="featured-post-description">Начните тестировать с Testo уже сегодня и помогите сделать его лучше к релизу!</p>
  </div>
</a>
</div>

<div class="home-feature">

## Продуманный API ассертов

<div class="home-feature-row">
<div class="home-feature-text">

Функции проверок разбиты на семантические группы:

- Фасад <class>\Testo\Assert</class> — утверждения, выполняются сразу
- Фасад <class>\Testo\Expect</class> — ожидания, откладываются до завершения теста

Пайповый синтаксис с группировкой по типу делает код лаконичным и типобезопасным.

</div>
<div class="home-feature-code">
<CodeTabs :tabs="assertTabs">

<template #assert>

```php
use Testo\Assert;

// Пайповые ассерты — группировка по типу
Assert::string($email)->contains('@');
Assert::int($age)->greaterThan(18);
Assert::file('config.php')->exists();

Assert::array($order->items)
    ->allOf(Item::class)
    ->hasCount(3);
```

</template>

<template #expect>

```php
use Testo\Expect;

// ORM должен остаться в памяти
Expect::leaks($orm);

// Тест упадёт, если сущности не будут подчищены
Expect::notLeaks(...$entitis);

// Валидация вывода
Expect::output()->contains('Done');
```

</template>

<template #expectException>

```php
// Где вы ещё такое видели?
Expect::exception(ValidationException::class)
    ->fromMethod(Service::class, 'validateInput')
    ->withMessage('Invalid input')
    ->withPrevious(
        WrongTypeException::class,
        static fn (ExpectedException $e) => $e
            ->withCode(42)
            ->withMessage('Field "age" must be integer.'),
    );
```

</template>

<template #expectAttr>

```php
/**
 * Можно использовать атрибуты для ожидания исключений
 */
#[ExpectException(ValidationException::class)]
public function testInvalidInput(): void
{
    $input = ['age' => 'twenty'];

    $this->service->validateInput($input);
}
```

</template>

</CodeTabs>
</div>
</div>
</div>

<div class="home-feature">

## Разные способы объявления тестов

<div class="home-feature-row">
<div class="home-feature-text">

Пишите тесты так, как удобно вам.

- Тестами могут быть классы, функции или даже атрибуты прямо в продуктовом коде (Inline Tests).
- Классы не нужно наследовать от базового тестового класса. Код остаётся чистым.
- Обнаружение тестов по соглашениям об именовании или по явным атрибутам.

</div>
<div class="home-feature-code">
<CodeTabs :tabs="declareTabs">

<template #declare-class>

```php
// Явное объявление теста в методе с атрибутом #[Test]

final class OrderTest
{
    #[Test]
    public function createsOrderWithItems(): void
    {
        $order = new Order();
        $order->addItem(new Product('Bread'));

        Assert::int($order->itemCount())->equals(1);
    }
}
```

</template>

<template #declare-function>

```php
// Явное обозначение теста атрибутом #[Test]
// или префиксом "test" в имени функции

#[Test]
function validates_email_format(): void
{
    $validator = new EmailValidator();

    Assert::true($validator->isValid('user@example.com'));
    Assert::false($validator->isValid('invalid'));
}

function testEmailValidator(): void { ... }
```

</template>

<template #declare-convention>

```php
// Суффикс "Test" на классе и префикс "test" на методах

final class UserServiceTest
{
    public function testCreatesUser(): void
    {
        $user = $this->service->create('john@example.com');

        Assert::string($user->email)->contains('@');
    }

    public function testDeletesUser(): void { /* ... */ }
}
```

</template>

<template #declare-inline>

```php
// Тестируем метод прямо в коде
// Для простых случаев удобно

final class Calculator
{
    #[TestInline([1, 1], 2)]
    #[TestInline([40, 2], 42)]
    #[TestInline([-5, 5], 0)]
    public function sum(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

</template>

</CodeTabs>
</div>
</div>
</div>

<div class="home-feature">

## Полноценная интеграция с IDE

<div class="home-feature-row">
<div
  class="home-feature-bg-image"
  :style="{ '--bg-image-light': `url(${ideScreenshot.light})`, '--bg-image-dark': `url(${ideScreenshot.dark})` }"
></div>
<div class="home-feature-text">

Нативный плагин для PhpStorm и IntelliJ IDEA.

Весь привычный функционал: запуск и перезапуск из gutter-иконок, навигация между тестами и кодом, отладка с брейкпоинтами, генерация тестов, дерево результатов.

<JetBrainsPluginButton :pluginId="jbPlugin.pluginId" :downloads="jbPlugin.downloads" :rating="jbPlugin.rating" />

</div>
</div>
</div>

<div class="home-feature">

## Бенчмарки одним атрибутом

<HomeBench code-tab="Bench.php" result-tab="Результат">

<template #description>

Добавьте атрибут <attr>\Testo\Bench</attr> к методу, и Testo покажет, какая из реализаций работает быстрее. Со статистикой, фильтрацией выбросов и рекомендациями по стабильности.

</template>

<template #left>

```php
// Эталонный метод с атрибутом #[Bench]
#[Bench(
    callables: ['sumInCycle' => [self::class, 'sumInCycle']],
    arguments: [1, 5_000],
)]
public static function sumInArray(int $a, int $b): int
{
    return \array_sum(\range($a, $b));
}
```

</template>

<template #right>

```php
// Альтернативная реализация
public static function sumInCycle(int $a, int $b): int
{
    $result = 0;
    for ($i = $a; $i <= $b; ++$i) {
        $result += $i;
    }
    return $result;
}
```

</template>

<template #result>

```
Results for sumInArray:
+--------------------------+------------------------------------------------+---------+
| BENCHMARK SETUP          | TIME RESULTS                                   | SUMMARY |
| Name     | Iters | Calls | Mean              | Median            | RStDev | Place   |
+----------+-------+-------+-------------------+-------------------+--------+---------+
| current  | 10    | 1000  | 11.65µs           | 11.58µs           | ±1.55% | 1st     |
| in cycle | 10    | 1000  | 43.80µs (+275.8%) | 44.17µs (+281.5%) | ±1.67% | 2nd     |
+----------+-------+-------+-------------------+-------------------+--------+---------+

```

</template>

</HomeBench>

</div>

<div class="sponsors-section">
  <h2 class="sponsors-title">Спонсоры</h2>
  <div class="sponsors-grid">
    <a href="https://buhta.com" class="sponsor-card sponsor-logo" target="_blank" rel="noopener">
      <img src="/logo-buhta.svg" alt="Buhta" class="sponsor-image">
    </a>
  </div>
  <div class="sponsor-cta-link">
    <a href="/ru/sponsor">Стать спонсором</a>
    <span class="separator">|</span>
    <a href="https://github.com/php-testo/testo" target="_blank" rel="noopener">Поставить звезду</a>
  </div>
</div>
