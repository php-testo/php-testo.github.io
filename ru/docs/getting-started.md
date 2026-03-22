---
faqLevel: 2
---

# Начало работы

## Установка

Установите Testo через Composer:

```bash
composer require --dev testo/testo
```

<p style="display: flex; gap: 8px;">
  <a href="https://packagist.org/packages/testo/testo"><img src="https://img.shields.io/packagist/php-v/testo/testo.svg?style=flat-square&logo=php" alt="PHP" style="display: inline-block;"></a>
  <a href="https://packagist.org/packages/testo/testo"><img src="https://img.shields.io/packagist/v/testo/testo.svg?style=flat-square&logo=packagist" alt="Latest Version on Packagist" style="display: inline-block;"></a>
  <a href="https://github.com/php-testo/testo/blob/1.x/LICENSE.md"><img src="https://img.shields.io/packagist/l/testo/testo.svg?style=flat-square" alt="License" style="display: inline-block;"></a>
  <a href="https://packagist.org/packages/testo/testo/stats"><img src="https://img.shields.io/packagist/dt/testo/testo.svg?style=flat-square" alt="Total Downloads" style="display: inline-block;"></a>
</p>

## Конфигурация

По умолчанию, если конфигурационный файл не указан, Testo запустит тесты из папки `tests`.

Чтобы настроить конфигурацию, создайте файл `testo.php` в корне проекта:

```php
<?php

declare(strict_types=1);

use Testo\Application\Config\ApplicationConfig;
use Testo\Application\Config\SuiteConfig;
use Testo\Application\Config\FinderConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: ['tests/Unit'],
        ),
        new SuiteConfig(
            name: 'Sources',
            location: ['src'],
        ),
    ],
);
```

В этом примере мы определили два набора тестов: `Unit` для юнит-тестов, расположенных в `tests/Unit`, и `Sources` для [встроенных тестов](plugins/inline.md) и [бенчмарков](plugins/bench.md) прямо в коде проекта, в папке `src`.

Чтобы узнать больше о конфигурации, посетите раздел [Конфигурация](configuration.md).

## Написание первого теста

Создайте тестовый класс в настроенной директории (например, `tests/Unit/MyFirstTest.php`) и добавьте метод с атрибутом <attr>\Testo\Test</attr>:

```php
final class MyFirstTest
{
    #[Test]
    public function dividesNumbers(): void
    {
        $result = 10 / 2;

        Assert::same($result, 5.0);
        Assert::notSame($result, 5); // Типы важны
    }
}
```

Атрибут <attr>\Testo\Test</attr> помечает метод как тестовый, а фасад <class>\Testo\Assert</class> проверяет утверждения. Подробнее о способах написания тестов, атрибутах и конвенциях — в разделе [Пишем тесты](writing-tests.md).

## Запуск тестов

Чтобы запустить тесты, выполните:

```bash
vendor/bin/testo
```

Вы увидите вывод с результатами тестов и детальной информацией о пройденных и упавших тестах.

## Поддержка IDE

Для PhpStorm и IntelliJ IDEA существует официальный плагин IDEA.

<JetBrainsPlugin />

Плагин предоставляет:
- Запуск тестов прямо из IDE
- Навигацию между тестом и реализацией
- Визуализацию результатов тестов
- Поддержку отладки
