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

use Testo\Config\ApplicationConfig;
use Testo\Config\SuiteConfig;
use Testo\Config\FinderConfig;

return new ApplicationConfig(
    suites: [
        new SuiteConfig(
            name: 'Unit',
            location: new FinderConfig(
                include: ['tests/Unit'],
            ),
        ),
    ],
);
```

## Написание первого теста

Создайте тестовый класс в настроенной директории (например, `tests/CalculatorTest.php`):

```php
<?php

declare(strict_types=1);

namespace Tests;

use Testo\Assert;
use Testo\Attribute\Test;
use Testo\Attribute\RetryPolicy;
use Testo\Attribute\ExpectException;

final class CalculatorTest
{
    #[Test]
    public function dividesNumbers(): void
    {
        $result = 10 / 2;

        Assert::same(5.0, $result);
        Assert::notSame(5, $result); // Типы важны!
    }

    #[Test]
    #[RetryPolicy(maxAttempts: 3)]
    public function flakyApiCall(): void
    {
        // Повторяет до 3 раз при падении теста
        $response = $this->makeExternalApiCall();

        Assert::same(200, $response->status);
    }

    #[Test]
    #[ExpectException(\RuntimeException::class)]
    public function throwsException(): void
    {
        throw new \RuntimeException('Expected error');
    }
}
```

### Ключевые моменты

- Атрибут `#[Test]` помечает тестовые методы, при этом классам не нужно наследовать базовый класс. Подробнее в разделе [Пишем тесты](./writing-tests).
- Используйте фасад `Assert` для утверждений и `Expect` для ожиданий.
- Testo предоставляет множество атрибутов для расширения возможностей тестирования (политики повторов, обработка исключений и другое).

## Запуск тестов

Чтобы запустить тесты, выполните:

```bash
vendor/bin/testo
```

Вы увидите вывод с результатами тестов и детальной информацией о пройденных и упавших тестах.

## Поддержка IDE

Для PhpStorm и IntelliJ IDEA существует официальный [плагин IDEA](https://plugins.jetbrains.com/plugin/28842-testo).

Плагин предоставляет:
- Запуск тестов прямо из IDE
- Навигацию между тестом и реализацией
- Визуализацию результатов тестов
- Поддержку отладки
