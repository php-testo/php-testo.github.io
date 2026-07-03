---
outline: [2, 3]
---

# Mockery

[Mockery](https://github.com/mockery/mockery) — популярная библиотека мокирования для PHP с выразительным API (`Mockery::mock()`, `expects()`, `spy()`). Пакет `testo/bridge-mockery` интегрирует её с Testo.

<plugin-info name="Mockery" class="\Testo\Bridge\Mockery\MockeryPlugin" />

## Установка

```bash
composer require --dev mockery/mockery testo/bridge-mockery
```

## Подключение

Зарегистрируйте <class>\Testo\Bridge\Mockery\MockeryPlugin</class> в секции `plugins` — на уровне приложения (для всех сьютов) или отдельного Test Suite (для конкретного набора тестов).

::: code-group
```php [Уровень приложения]
use Testo\Application\Config\ApplicationConfig;
use Testo\Bridge\Mockery\MockeryPlugin;

return new ApplicationConfig(
    src: ['src'],
    suites: [ /** Suites **/ ],
    plugins: [
        new MockeryPlugin(),
    ],
);
```

```php [Уровень Test Suite]
use Testo\Application\Config\SuiteConfig;
use Testo\Bridge\Mockery\MockeryPlugin;

new SuiteConfig(
    name: 'Unit',
    location: ['tests/Unit'],
    plugins: [
        new MockeryPlugin(),
    ],
);
```
:::

## Поведение проверок моков

Адаптер автоматически проверяет ожидания моков после каждого теста и связывает результат со статусами Testo — ручной teardown не нужен. Правило простое: **задекларировали ожидание и выполнили — хорошо, не выполнили — ошибка.**

- **Выполненное ожидание** засчитывается как проверка. Поэтому тест, где единственная проверка — мок, остаётся <enum>\Testo\Core\Value\Status::Passed</enum>, а не <enum>\Testo\Core\Value\Status::Risky</enum> (этим статусом Testo помечает успешный тест без единой проверки — защита от забытого ассерта, см. <plugin>Assert</plugin>).
- **Невыполненное ожидание** проваливает тест (**Failed**) и попадает в историю проверок как неуспешное.

::: code-group
```php [Passed]
#[Test]
public function notifies(): void
{
    $mailer = Mockery::mock(Mailer::class);
    $mailer->expects('send')->once();       // ожидание — и есть проверка

    (new Notifier($mailer))->notify('hi');  // send() вызывается один раз, выполняя ожидание
}
```

```php [Risky]
#[Test]
public function notifies(): void
{
    $mailer = Mockery::spy(Mailer::class);

    (new Notifier($mailer))->notify('hi');
    // ни ожидания, ни ассерта — проверять нечего → Risky
}
```

```php [Failed]
#[Test]
public function notifies(): void
{
    $mailer = Mockery::mock(Mailer::class);
    $mailer->expects('send')->once();       // ждём ровно один вызов send()

    // …но notify() так и не вызвали → ожидание не выполнено → Failed
}
```
:::

::: info
Плагин настроен только на обычные тесты (например, помеченные атрибутом <attr>\Testo\Test</attr>). Во встроенных тестах, бенчмарках и других моки автоматически не проверяются и не очищаются — этим придётся управлять самостоятельно средствами Mockery.
:::
