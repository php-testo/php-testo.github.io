# Конфигурация

По умолчанию, если конфигурационный файл не указан, Testo запустит тесты из папки `tests` с набором плагинов по умолчанию.

Чтобы сконфигурировать Testo, создайте файл `testo.php` в корне проекта. Файл должен возвращать экземпляр `ApplicationConfig`:

```php
<?php

declare(strict_types=1);

use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: ['tests/Unit'],
        ),
        new SuiteConfig(
            name: 'Feature',
            location: ['tests/Feature'],
        ),
    ],
);
```

## ApplicationConfig

Корневой объект конфигурации:

- `suites` — массив Test Suite. Должен содержать хотя бы один элемент — пустой массив вызовет ошибку.
- `plugins` — плагины уровня приложения. Загружаются до загрузки Test Suite и действуют глобально (подробнее в разделе [Плагины](#плагины)).

Все параметры и их значения по умолчанию описаны в самом классе — IDE покажет подсказки.

## SuiteConfig

Конфигурация отдельного Test Suite: имя, расположение тестов и набор плагинов.

```php
// Простая форма — массив
new SuiteConfig(
    name: 'Unit',
    location: ['tests/Unit'],
    plugins: [new NamingConventionPlugin()],
),

// С кастомизацией — FinderConfig и SuitePlugins
new SuiteConfig(
    name: 'Unit',
    location: new FinderConfig(
        include: ['tests/Unit'],
        exclude: ['tests/Unit/Stubs'],
    ),
    plugins: SuitePlugins::without(BenchmarkPlugin::class),
),
```

::: info
Массивы в `location` и `plugins` — сокращения для `new FinderConfig(include: ...)` и `SuitePlugins::with(...)`. Для более гибкой настройки используйте `FinderConfig` и `SuitePlugins` напрямую.
:::

::: question Можно ли отключить плагины Application-уровня для конкретного Test Suite?
Нет, плагины уровня приложения загружаются до загрузки Test Suite и действуют глобально.
:::

## FinderConfig

Определяет область поиска файлов — какие директории и файлы включить, а какие исключить. Пути задаются относительно корня проекта. Glob-паттерны и регулярные выражения не поддерживаются.

```php
new FinderConfig(
    include: ['tests'],
    exclude: ['tests/Fixtures', 'tests/Stubs'],
)
```

## Плагины

Testo построен на [плагинах](plugins.md) — именно они определяют, как находятся, запускаются и обрабатываются тесты. Плагины подключаются на двух уровнях:

- **Уровень приложения** (`ApplicationConfig::$plugins`) — действуют глобально на все Test Suite
- **Уровень Test Suite** (`SuiteConfig::$plugins`) — действуют только в конкретном Test Suite

Если массив `plugins` не указан, Testo подключает набор плагинов по умолчанию.

::: question Какие плагины приложения подключаются по умолчанию?
Вы можете посмотреть список плагинов по умолчанию в классе `ApplicationPlugins`.

Сейчас это:
- [Filter](plugins/filter.md)
- **Terminal** и **Teamcity** в зависимости от флага `--teamcity`
:::

::: question Какие плагины Test Suite подключаются по умолчанию?
Вы можете посмотреть список плагинов по умолчанию в классе `SuitePlugins`.

Сейчас это:
- [Assert](plugins/assert.md)
- [Bench](plugins/bench.md)
- [Inline](plugins/inline.md)
- [Lifecycle](plugins/lifecycle.md)
- [Test](plugins/test.md)
:::

### Управление плагинами

Для настройки плагинов используются фасады `SuitePlugins` и `ApplicationPlugins` (идентичный API):

::: code-group
```php [with()]
// Добавить NamingConventionPlugin к плагинам по умолчанию
// Остальные плагины Test Suite сохраняются
new SuiteConfig(
    plugins: SuitePlugins::with(
        new NamingConventionPlugin(),
    ),
)
```
```php [without()]
// Убрать BenchmarkPlugin из набора по умолчанию
// Остальные плагины Test Suite сохраняются
new SuiteConfig(
    plugins: SuitePlugins::without(
        BenchmarkPlugin::class,
    ),
)
```
```php [only()]
// Только LifecyclePlugin — все остальные отключены
// Полная замена набора по умолчанию
new SuiteConfig(
    plugins: SuitePlugins::only(
        new LifecyclePlugin(),
    ),
)
```
```php [Цепочка]
// Добавить один плагин и убрать другой
// Методы можно комбинировать в цепочку
new SuiteConfig(
    plugins: SuitePlugins::with(new NamingConventionPlugin())
        ->without(BenchmarkPlugin::class),
)
```
:::

## Монорепозиторий

Поскольку `suites` — это обычный массив PHP, конфигурации можно собирать из нескольких модулей. Каждый модуль имеет свой `testo.php`, который работает и самостоятельно, и как источник Test Suite для корневого конфига:

```php
// modules/billing/testo.php — работает автономно
return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Billing',
            location: ['tests'],
        ),
    ],
);
```

```php
// testo.php — корневой конфиг собирает Test Suite из модулей
return new ApplicationConfig(
    suites: array_merge(
        (require 'modules/billing/testo.php')->suites,
        (require 'modules/shipping/testo.php')->suites,
    ),
);
```

Каждый модуль управляет своей конфигурацией тестов независимо, а корневой конфиг запускает всё разом.
